using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class UsuarioCreateDto
    {
        [Required]
        [MinLength(1)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [SenhaValida]
        public string Senha { get; set; } = string.Empty;

        [Required]
        [RegularExpression(
        "^(Tipo 1|Tipo 2|Gestacional|Outro)$",
        ErrorMessage = "Tipo de diabetes inválido."
        )]
        public string TipoDiabetes { get; set; } = string.Empty;

        [Range(1, 120)]
        public int? Idade { get; set; }


        public string? Celular { get; set; }

        [Range(1, 600)]
        public int FatorSensibilidade { get; set; }

        [Range(1, 600)]
        public int HgtAlvo { get; set; }

        public bool AceitouTermos { get; set; }
        public bool ConsentiuDadosSaude { get; set; }
        [MaxLength(150)]
        public string? ResponsavelNome { get; set; }
        public bool ConsentimentoResponsavel { get; set; }
    }
}