using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Domain.Exceptions;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/usuario")]
    [EnableRateLimiting("fixed")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _service;

        public UsuarioController(IUsuarioService service)
        {
            _service = service;
        }

        [HttpPost]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Create(UsuarioCreateDto dto)
        {
            if (!dto.AceitouTermos || !dto.ConsentiuDadosSaude)
            {
                return BadRequest("É necessário aceitar os termos e consentir com o tratamento dos dados de saúde.");
            }

            if (dto.Idade < 18
                && (string.IsNullOrWhiteSpace(dto.ResponsavelNome) || !dto.ConsentimentoResponsavel))
            {
                return BadRequest("Para menores de 18 anos, informe o nome do responsável legal e marque a autorização.");
            }

            (ResultadoCriacaoUsuario Resultado, CadastroPendenteDto? Cadastro) resultado;
            try
            {
                resultado = await _service.CreateAsync(dto);
            }
            catch (IntervaloReenvioException ex)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, ex.Message);
            }
            catch (EmailDeliveryException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }

            if (resultado.Resultado == ResultadoCriacaoUsuario.EmailJaExiste)
            {
                return Conflict(
                    "Já existe um usuário cadastrado com este e-mail.");
            }

            return StatusCode(201, resultado.Cadastro);
        }

        [HttpPost("consultar-cadastro")]
        [EnableRateLimiting("verification")]
        public async Task<IActionResult> ConsultarCadastro(ConsultarCadastroDto dto)
        {
            var resultado = await _service.ConsultarCadastroAsync(dto);
            return Ok(resultado);
        }

        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var usuario = await _service.LoginAsync(dto);

            if (usuario.EmailNaoConfirmado)
            {
                return StatusCode(StatusCodes.Status403Forbidden, "E-mail ainda não confirmado.");
            }

            if (usuario.Resposta == null)
            {
                return Unauthorized("Email ou senha inválidos.");
            }

            return Ok(usuario.Resposta);
        }

        [HttpPost("confirmar-email")]
        [EnableRateLimiting("verification")]
        public async Task<IActionResult> ConfirmarEmail(ConfirmarEmailDto dto)
        {
            try
            {
                await _service.ConfirmarEmailAsync(dto);
                return Ok(new { mensagem = "E-mail confirmado com sucesso." });
            }
            catch (CodigoVerificacaoException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("reenviar-codigo")]
        [EnableRateLimiting("verification")]
        public async Task<IActionResult> ReenviarCodigo(ReenviarCodigoDto dto)
        {
            try
            {
                await _service.ReenviarCodigoAsync(dto);
                return Ok(new { mensagem = "Se houver um cadastro pendente, um novo código será enviado." });
            }
            catch (IntervaloReenvioException ex)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, ex.Message);
            }
            catch (EmailDeliveryException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [HttpPost("confirmar-novo-email")]
        [Authorize]
        public async Task<IActionResult> ConfirmarNovoEmail(ConfirmarNovoEmailDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (usuarioIdClaim == null || !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
            {
                return Unauthorized();
            }

            try
            {
                await _service.ConfirmarNovoEmailAsync(usuarioId, dto);
                return Ok(new { mensagem = "E-mail atualizado com sucesso." });
            }
            catch (CodigoVerificacaoException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("recuperar-senha")]
        [EnableRateLimiting("verification")]
        public async Task<IActionResult> RecuperarSenha(RecuperarSenhaDto dto)
        {
            try
            {
                await _service.SolicitarRecuperacaoSenhaAsync(dto);
            }
            catch (EmailDeliveryException)
            {
                // The SMTP failure is logged by EmailService; keep this endpoint's
                // response generic so account existence cannot be inferred.
            }

            return Ok(new { mensagem = "Se houver uma conta ativa para este e-mail, enviaremos um código." });
        }

        [HttpPost("redefinir-senha")]
        [EnableRateLimiting("verification")]
        public async Task<IActionResult> RedefinirSenha(RedefinirSenhaDto dto)
        {
            try
            {
                await _service.RedefinirSenhaAsync(dto);
                return Ok(new { mensagem = "Senha alterada com sucesso." });
            }
            catch (CodigoVerificacaoException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("reativar")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> ReativarConta(ReativarContaDto dto)
        {
            var reativado = await _service.ReativarContaAsync(dto);

            if (!reativado)
            {
                return BadRequest("Não foi possível reativar a conta.");
            }

            return Ok("Conta reativada com sucesso.");
        }

        [Authorize]
        [HttpGet("perfil")]
        public async Task<IActionResult> GetPerfil()
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var usuario = await _service.GetByIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound();
            }

            return Ok(usuario);
        }

        [Authorize]
        [HttpPatch("perfil")]
        public async Task<IActionResult> PatchPerfil(UsuarioPatchDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (usuarioIdClaim == null || !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
            {
                return Unauthorized();
            }

            ResultadoPatchUsuario resultado;
            try
            {
                resultado = await _service.PatchAsync(usuarioId, dto);
            }
            catch (IntervaloReenvioException ex)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, ex.Message);
            }
            catch (EmailDeliveryException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }

            if (resultado == ResultadoPatchUsuario.UsuarioNaoEncontrado)
            {
                return NotFound();
            }

            if (resultado == ResultadoPatchUsuario.EmailJaExiste)
            {
                return Conflict("Já existe um usuário cadastrado com este e-mail.");
            }

            return NoContent();
        }

        [Authorize]
        [HttpDelete("perfil")]
        public async Task<IActionResult> DeletePerfil()
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var deletado = await _service.DeleteAsync(usuarioId);

            if (!deletado)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var usuarios = await _service.GetAllAsync();

            return Ok(usuarios);
        }
    }
}