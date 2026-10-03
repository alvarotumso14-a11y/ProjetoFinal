using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IUsuarioRepository
    {
        Task AddAsync(Usuario usuario);
        void Update (Usuario usuario);
        Task <Usuario?> GetByIdAsync (int id);
        Task<List<Usuario>> GetAllAsync ();
        Task SaveChangesAsync ();
        Task<Usuario?> GetByEmailAsync(string email);

    }
}
