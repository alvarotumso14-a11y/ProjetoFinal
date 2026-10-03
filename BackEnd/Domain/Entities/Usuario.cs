using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Usuario
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TipoDiabetes { get; set; } = string.Empty;
        public int FatorSensibilidade { get; set; }
        public int HgtAlvo { get; set; }
        public string Senha { get; set; } = string.Empty;
        public int? Idade { get; set; }
        public string? Celular { get; set; }
        public string Role {  get; set; } = "Usuario";
        public bool Ativo { get; set; } = true;
        public List<RegistroGlicemia> RegistroGlicemia { get; set; } = new ();
    }
}