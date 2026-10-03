using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class RegistroGlicemiaRepository : IRegistroGlicemiaRepository
    {
        private readonly AppDbContext _context;

        public RegistroGlicemiaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(RegistroGlicemia registro)
        {
            await _context.RegistrosGlicemia.AddAsync(registro);
        }

        public void Delete(RegistroGlicemia registro)
        {
            _context.RegistrosGlicemia.Remove(registro);
        }

        public async Task<List<RegistroGlicemia>> GetAllUsuarioIdAsync(int usuarioId)
        {
            return await _context.RegistrosGlicemia
                .Where(r => r.UsuarioId == usuarioId)
                .ToListAsync();
        }

        public async Task<RegistroGlicemia?> GetByIdAsync(int id, int usuarioId)
        {
            return await _context.RegistrosGlicemia
                .FirstOrDefaultAsync(p => p.Id == id
                && p.UsuarioId == usuarioId);
        }

        public async Task<List<RegistroGlicemia>> GetByPeriodoAsync(int usuarioId, DateOnly dataInicial, DateOnly dataFinal)
        {
            return await _context.RegistrosGlicemia
                .Where(r =>
                    r.UsuarioId == usuarioId &&
                    r.Data >= dataInicial &&
                    r.Data <= dataFinal)
                .OrderBy(r => r.Data)
                .ThenBy(r => r.Hora)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public void Update(RegistroGlicemia registro)
        {
            _context.RegistrosGlicemia.Update(registro);
        }
    }
}