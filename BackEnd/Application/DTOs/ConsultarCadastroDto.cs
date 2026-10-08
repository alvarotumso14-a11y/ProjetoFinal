using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ConsultarCadastroDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ConsultarCadastroResponseDto
{
    public string Status { get; set; } = "novo";
}
