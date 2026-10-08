using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ConfirmarNovoEmailDto
{
    [Required]
    [RegularExpression(@"^\d{6}$")]
    public string Codigo { get; set; } = string.Empty;
}
