using Domain.Entities;

namespace Domain.Interfaces;

public interface ICodigoVerificacaoRepository
{
    Task AddAsync(CodigoVerificacao codigo);
    Task<CodigoVerificacao?> GetByTentativaAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo,
        Guid tentativaId);
    Task<CodigoVerificacao?> GetMaisRecenteAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo);
    Task<CodigoVerificacao?> GetMaisRecentePorHashAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo,
        string codigoHash);
    Task<List<CodigoVerificacao>> GetAtivosAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo);
    Task SaveChangesAsync();
}
