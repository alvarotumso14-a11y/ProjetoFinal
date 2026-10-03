using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Exceptions;

namespace Application.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _repository;
        private readonly ITokenService _tokenService;

        public UsuarioService(
            IUsuarioRepository repository,
            ITokenService tokenService)
        {
            _repository = repository;
            _tokenService = tokenService;
        }

        public async Task<(
            ResultadoCriacaoUsuario Resultado,
            UsuarioOutputDto? Usuario)> CreateAsync(UsuarioCreateDto dto)
        {
            var usuarioExiste =
                await _repository.GetByEmailAsync(dto.Email);

            if (usuarioExiste != null)
            {
                return (
                    ResultadoCriacaoUsuario.EmailJaExiste,
                    null
                );
            }

            var usuario = new Usuario
            {
                Name = dto.Name,
                Email = dto.Email,
                Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                TipoDiabetes = dto.TipoDiabetes,
                Idade = dto.Idade,
                Celular = dto.Celular,
                FatorSensibilidade = dto.FatorSensibilidade,
                HgtAlvo = dto.HgtAlvo,
                Role = "Usuario"
            };

            await _repository.AddAsync(usuario);

            try
            {
                await _repository.SaveChangesAsync();
            }

            catch (EmailJaExisteException)
            {
                return (
                    ResultadoCriacaoUsuario.EmailJaExiste,
                    null
                );
            }

            return (
                ResultadoCriacaoUsuario.Sucesso,
                MapearParaOutput(usuario)
            );
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
        {
            var usuario = await _repository.GetByEmailAsync(dto.Email);

            if (usuario == null)
            {
                return null;
            }

            if (!usuario.Ativo)
            {
                return null;
            }

            var senhaCorreta = BCrypt.Net.BCrypt.Verify(
                dto.Senha,
                usuario.Senha
            );

            if (!senhaCorreta)
            {
                return null;
            }

            var token = _tokenService.GenerateToken(usuario);

            return new LoginResponseDto
            {
                Token = token,
                Usuario = MapearParaOutput(usuario)
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var usuario = await _repository.GetByIdAsync(id);

            if (usuario == null)
            {
                return false;
            }

            usuario.Ativo = false;

            _repository.Update(usuario);

            await _repository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ReativarContaAsync(ReativarContaDto dto)
        {
            var usuario = await _repository.GetByEmailAsync(dto.Email);

            if (usuario == null)
            {
                return false;
            }

            if (usuario.Ativo)
            {
                return false;
            }

            var senhaCorreta = BCrypt.Net.BCrypt.Verify(
                dto.Senha,
                usuario.Senha
            );

            if (!senhaCorreta)
            {
                return false;
            }

            usuario.Ativo = true;

            _repository.Update(usuario);

            await _repository.SaveChangesAsync();

            return true;
        }

        public async Task<List<UsuarioOutputDto>> GetAllAsync()
        {
            var usuarios = await _repository.GetAllAsync();

            return usuarios
                .Select(usuario => MapearParaOutput(usuario))
                .ToList();
        }

        public async Task<UsuarioOutputDto?> GetByIdAsync(int id)
        {
            var usuario = await _repository.GetByIdAsync(id);

            if (usuario == null)
            {
                return null;
            }

            return MapearParaOutput(usuario);
        }

        public async Task<ResultadoPatchUsuario> PatchAsync(
            int id,
            UsuarioPatchDto dto)
        {
            var usuario = await _repository.GetByIdAsync(id);

            if (usuario == null)
            {
                return ResultadoPatchUsuario.UsuarioNaoEncontrado;
            }

            if (dto.Name != null)
            {
                usuario.Name = dto.Name;
            }

            if (dto.Email != null)
            {
                var usuarioComMesmoEmail =
                    await _repository.GetByEmailAsync(dto.Email);

                if (usuarioComMesmoEmail != null &&
                    usuarioComMesmoEmail.Id != usuario.Id)
                {
                    return ResultadoPatchUsuario.EmailJaExiste;
                }

                usuario.Email = dto.Email;
            }

            if (dto.TipoDiabetes != null)
            {
                usuario.TipoDiabetes = dto.TipoDiabetes;
            }

            if (dto.Idade != null)
            {
                usuario.Idade = dto.Idade;
            }

            if (dto.Celular != null)
            {
                usuario.Celular = dto.Celular;
            }

            if (dto.FatorSensibilidade != null)
            {
                usuario.FatorSensibilidade =
                    dto.FatorSensibilidade.Value;
            }

            if (dto.HgtAlvo != null)
            {
                usuario.HgtAlvo =
                    dto.HgtAlvo.Value;
            }

            _repository.Update(usuario);

            try
            {
                await _repository.SaveChangesAsync();
            }
            catch (EmailJaExisteException)
            {
                return ResultadoPatchUsuario.EmailJaExiste;
            }

            return ResultadoPatchUsuario.Sucesso;
        }

        public async Task<bool> UsuarioAtivoAsync(int id)
        {
            var usuario = await _repository.GetByIdAsync(id);

            if (usuario == null)
            {
                return false;
            }

            return usuario.Ativo;
        }

        private UsuarioOutputDto MapearParaOutput(Usuario usuario)
        {
            return new UsuarioOutputDto
            {
                Id = usuario.Id,
                Name = usuario.Name,
                Email = usuario.Email,
                TipoDiabetes = usuario.TipoDiabetes,
                Idade = usuario.Idade,
                Celular = usuario.Celular,
                FatorSensibilidade = usuario.FatorSensibilidade,
                HgtAlvo = usuario.HgtAlvo
            };
        }
    }
}