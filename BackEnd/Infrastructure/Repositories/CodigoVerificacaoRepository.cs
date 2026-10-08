using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CodigoVerificacaoRepository : ICodigoVerificacaoRepository
{
    private readonly AppDbContext _context;

    public CodigoVerificacaoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(CodigoVerificacao codigo)
    {
        await _context.CodigosVerificacao.AddAsync(codigo);
    }

    public Task<CodigoVerificacao?> GetByTentativaAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo,
        Guid tentativaId) =>
        _context.CodigosVerificacao
            .Where(c => c.UsuarioId == usuarioId
                && c.Tipo == tipo
                && c.TentativaId == tentativaId)
            .OrderByDescending(c => c.CriadoEm)
            .FirstOrDefaultAsync();

    public Task<CodigoVerificacao?> GetMaisRecenteAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo) =>
        _context.CodigosVerificacao
            .Where(c => c.UsuarioId == usuarioId && c.Tipo == tipo)
            .OrderByDescending(c => c.CriadoEm)
            .FirstOrDefaultAsync();

    public Task<CodigoVerificacao?> GetMaisRecentePorHashAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo,
        string codigoHash) =>
        _context.CodigosVerificacao
            .Where(c => c.UsuarioId == usuarioId
                && c.Tipo == tipo
                && c.CodigoHash == codigoHash)
            .OrderByDescending(c => c.CriadoEm)
            .FirstOrDefaultAsync();

    public Task<List<CodigoVerificacao>> GetAtivosAsync(
        int usuarioId,
        TipoCodigoVerificacao tipo) =>
        _context.CodigosVerificacao
            .Where(c => c.UsuarioId == usuarioId
                && c.Tipo == tipo
                && c.UsadoEm == null)
            .OrderByDescending(c => c.CriadoEm)
            .ToListAsync();

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
