using Application.DTOs;

namespace Application.Interfaces
{
    public interface IUsuarioService
    {
        Task<(ResultadoCriacaoUsuario Resultado, CadastroPendenteDto? Cadastro)> CreateAsync(UsuarioCreateDto usuario);
        Task<LoginResultDto> LoginAsync(LoginDto dto);
        Task<ConsultarCadastroResponseDto> ConsultarCadastroAsync(ConsultarCadastroDto dto);
        Task ConfirmarEmailAsync(ConfirmarEmailDto dto);
        Task ReenviarCodigoAsync(ReenviarCodigoDto dto);
        Task ConfirmarNovoEmailAsync(int usuarioId, ConfirmarNovoEmailDto dto);
        Task SolicitarRecuperacaoSenhaAsync(RecuperarSenhaDto dto);
        Task RedefinirSenhaAsync(RedefinirSenhaDto dto);
        Task<UsuarioOutputDto?> GetByIdAsync(int id);
        Task<List<UsuarioOutputDto>> GetAllAsync();
        Task<bool> DeleteAsync(int id);
        Task<bool> ReativarContaAsync(ReativarContaDto dto);
        Task<ResultadoPatchUsuario> PatchAsync(int id, UsuarioPatchDto dto);
        Task<bool> UsuarioAtivoAsync(int id);
    }
}