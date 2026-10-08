namespace Application.DTOs;

public class LoginResultDto
{
    public LoginResponseDto? Resposta { get; set; }
    public bool EmailNaoConfirmado { get; set; }
}
