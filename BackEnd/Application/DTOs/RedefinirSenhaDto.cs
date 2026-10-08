using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class RedefinirSenhaDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d{6}$")]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [SenhaValida]
    public string NovaSenha { get; set; } = string.Empty;
}
