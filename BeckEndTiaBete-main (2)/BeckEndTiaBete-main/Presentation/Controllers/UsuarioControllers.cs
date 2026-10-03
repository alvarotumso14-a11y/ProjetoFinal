using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

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
        public async Task<IActionResult> Create(UsuarioCreateDto dto)
        {
            var resultado = await _service.CreateAsync(dto);

            if (resultado.Resultado == ResultadoCriacaoUsuario.EmailJaExiste)
            {
                return Conflict(
                    "Já existe um usuário cadastrado com este e-mail.");
            }

            return StatusCode(201, resultado.Usuario);
        }

        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var usuario = await _service.LoginAsync(dto);

            if (usuario == null)
            {
                return Unauthorized("Email ou senha inválidos.");
            }

            return Ok(usuario);
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

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var resultado = await _service.PatchAsync(usuarioId, dto);

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