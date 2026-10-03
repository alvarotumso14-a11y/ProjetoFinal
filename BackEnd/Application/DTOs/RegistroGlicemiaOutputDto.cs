using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class RegistroGlicemiaOutputDto
    {
        public int Id { get; set; }
        public int? Glicemia {  get; set; }
        public bool GlicemiaAcimaDoLimite { get; set; }
        public int Dose { get; set; }
        public TimeSpan Hora {  get; set; }
        public string Refeicao { get; set; } = string.Empty;
        public DateOnly Data { get; set; }
        public string? Observacao { get; set; }
        public int UsuarioId {  get; set; }
       
    }
}
