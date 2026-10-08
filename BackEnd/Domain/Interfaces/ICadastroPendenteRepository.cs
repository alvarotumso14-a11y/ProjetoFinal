using Domain.Entities;

namespace Domain.Interfaces;

public interface ICadastroPendenteRepository
{
    Task AddAsync(CadastroPendente cadastro);
    Task<CadastroPendente?> GetByEmailAsync(string email);
    Task<CadastroPendente?> GetByIdAsync(Guid id);
    void Update(CadastroPendente cadastro);
    void Remove(CadastroPendente cadastro);
}
