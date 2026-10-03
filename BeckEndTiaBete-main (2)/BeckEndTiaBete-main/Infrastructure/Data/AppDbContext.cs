using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)  : base(options) 
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<RegistroGlicemia> RegistrosGlicemia { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>()
                .HasIndex(p => p.Email)
                .IsUnique();

            modelBuilder.Entity<RegistroGlicemia>()
                .Property(r => r.Observacao)
                .HasMaxLength(500);
        }

    }
}
