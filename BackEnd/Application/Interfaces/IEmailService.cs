namespace Application.Interfaces;

public enum TipoCodigoEmail
{
    ConfirmacaoEmail,
    NovoEmail,
    RecuperacaoSenha
}

public interface IEmailService
{
    Task EnviarCodigoAsync(
        string destinatario,
        string nome,
        string codigo,
        TipoCodigoEmail tipo,
        CancellationToken cancellationToken = default);
}
