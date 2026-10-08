using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CadastroPendenteRepository : ICadastroPendenteRepository
{
    private readonly AppDbContext _context;

    public CadastroPendenteRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task AddAsync(CadastroPendente cadastro) =>
        _context.CadastrosPendentes.AddAsync(cadastro).AsTask();

    public Task<CadastroPendente?> GetByEmailAsync(string email) =>
        _context.CadastrosPendentes.FirstOrDefaultAsync(c => c.Email == email);

    public Task<CadastroPendente?> GetByIdAsync(Guid id) =>
        _context.CadastrosPendentes.FirstOrDefaultAsync(c => c.Id == id);

    public void Update(CadastroPendente cadastro) =>
        _context.CadastrosPendentes.Update(cadastro);

    public void Remove(CadastroPendente cadastro) =>
        _context.CadastrosPendentes.Remove(cadastro);
}
