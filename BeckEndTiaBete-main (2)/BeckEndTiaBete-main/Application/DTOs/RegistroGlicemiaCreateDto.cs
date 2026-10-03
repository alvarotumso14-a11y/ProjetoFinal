using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs
{
    public class RegistroGlicemiaCreateDto : IValidatableObject
    {
        public int? Glicemia { get; set; }
        
        public bool GlicemiaAcimaDoLimite { get; set; }

        [Range(0, 100)]
        public int Dose { get; set; }

        public TimeSpan Hora { get; set; }

        [Required]
        public string Refeicao { get; set; } = string.Empty;

        public DateOnly Data { get; set; }

        [StringLength(500,
        ErrorMessage = "A observação deve ter no máximo 500 caracteres."
        )]
        public string? Observacao { get; set; }

        public IEnumerable<ValidationResult> Validate(
            ValidationContext validationContext)
        {
            if (Data == default)
            {
                yield return new ValidationResult(
                    "Informe uma data válida.",
                    new[] { nameof(Data) }
                );
            }

            if (GlicemiaAcimaDoLimite && Glicemia != null)
            {
                yield return new ValidationResult(
                    "Quando o aparelho indicar HI, não informe um valor numérico de glicemia.",
                    new[] { nameof(Glicemia), nameof(GlicemiaAcimaDoLimite) }
                );
            }

            if (!GlicemiaAcimaDoLimite && Glicemia == null)
            {
                yield return new ValidationResult(
                    "Informe o valor da glicemia.",
                    new[] { nameof(Glicemia) }
                );
            }
        }
    }
}