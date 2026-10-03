using Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class RegistroGlicemia
    {
        public int Id { get; set; }
        public int? Glicemia { get; set; }
        public bool GlicemiaAcimaDoLimite { get; set; }
        public int Dose { get; set; }
        public TimeSpan Hora { get; set; }
        public string Refeicao { get; set; } = string.Empty;
        public DateOnly Data { get; set; }
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        public string? Observacao { get; set; }
    }
}