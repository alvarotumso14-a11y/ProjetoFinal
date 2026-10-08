using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ConfirmarEmailDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d{6}$")]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    public Guid TentativaId { get; set; }
}
