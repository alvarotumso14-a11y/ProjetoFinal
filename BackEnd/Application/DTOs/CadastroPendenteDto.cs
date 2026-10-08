namespace Application.DTOs;

public class CadastroPendenteDto
{
    public Guid TentativaId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailEnviado { get; set; } = true;
    public string? Aviso { get; set; }
}
