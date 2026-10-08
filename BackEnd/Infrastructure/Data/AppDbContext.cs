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
        public DbSet<CodigoVerificacao> CodigosVerificacao { get; set; }
        public DbSet<CadastroPendente> CadastrosPendentes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>()
                .HasIndex(p => p.Email)
                .IsUnique();

            modelBuilder.Entity<RegistroGlicemia>()
                .Property(r => r.Observacao)
                .HasMaxLength(500);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.EmailPendente)
                .HasMaxLength(255);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.ResponsavelNome)
                .HasMaxLength(150);

            modelBuilder.Entity<CadastroPendente>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.HasIndex(c => c.Email).IsUnique();
                entity.Property(c => c.Email).HasMaxLength(255).IsRequired();
                entity.Property(c => c.SenhaHash).HasMaxLength(255).IsRequired();
                entity.Property(c => c.ResponsavelNome).HasMaxLength(150);
                entity.Property(c => c.CodigoHash).HasMaxLength(128).IsRequired();
            });

            modelBuilder.Entity<CodigoVerificacao>(entity =>
            {
                entity.HasIndex(c => new { c.UsuarioId, c.Tipo, c.CriadoEm });
                entity.Property(c => c.Tipo).HasConversion<string>().HasMaxLength(30);
                entity.Property(c => c.CodigoHash).HasMaxLength(128).IsRequired();
                entity.Property(c => c.NovoEmail).HasMaxLength(255);
                entity.HasOne(c => c.Usuario)
                    .WithMany()
                    .HasForeignKey(c => c.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

    }
}
