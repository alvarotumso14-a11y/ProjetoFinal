using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ReenviarCodigoDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
