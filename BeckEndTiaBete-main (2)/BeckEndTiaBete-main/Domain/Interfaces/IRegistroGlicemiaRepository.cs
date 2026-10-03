using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IRegistroGlicemiaRepository
    {
        Task AddAsync(RegistroGlicemia registro);
        void Update(RegistroGlicemia registro);
        Task<RegistroGlicemia?> GetByIdAsync(int id, int usuarioId);
        Task<List<RegistroGlicemia>> GetAllUsuarioIdAsync(int usuarioId);
        void Delete(RegistroGlicemia registro);
        Task SaveChangesAsync();
        Task<List<RegistroGlicemia>> GetByPeriodoAsync(int usuarioId, DateOnly dataInicial, DateOnly dataFinal);
    }
}