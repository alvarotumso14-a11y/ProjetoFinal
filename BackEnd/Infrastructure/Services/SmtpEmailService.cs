using Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.IO;
using System.Net.Sockets;

namespace Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private static readonly TimeSpan TimeoutEnvio = TimeSpan.FromSeconds(15);

    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(
        IOptions<SmtpOptions> options,
        ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task EnviarCodigoAsync(
        string destinatario,
        string nome,
        string codigo,
        TipoCodigoEmail tipo,
        CancellationToken cancellationToken = default)
    {
        ValidarConfiguracao();
        var template = EmailTemplates.Criar(nome, codigo, tipo);
        var remetente = new MailboxAddress(_options.FromName, _options.From);
        var message = new MimeMessage();
        message.From.Add(remetente);
        message.To.Add(MailboxAddress.Parse(destinatario));
        message.Subject = template.Assunto;
        message.Body = new BodyBuilder
        {
            TextBody = template.Texto,
            HtmlBody = template.Html
        }.ToMessageBody();

        var senha = string.Concat(_options.Password.Where(caractere => !char.IsWhiteSpace(caractere)));
        using var client = new SmtpClient();
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeoutEnvio);
        try
        {
            await client.ConnectAsync(
                _options.Host,
                _options.Port,
                SecureSocketOptions.StartTls,
                timeout.Token);
            await client.AuthenticateAsync(_options.User, senha, timeout.Token);
            await client.SendAsync(message, timeout.Token);
            await client.DisconnectAsync(true, timeout.Token);
        }
        catch (Exception ex) when (
            ex is SmtpCommandException
                or SmtpProtocolException
                or MailKit.Security.AuthenticationException
                or System.Security.Authentication.AuthenticationException
                or SaslException
                or OperationCanceledException
                or IOException
                or SocketException)
        {
            _logger.LogError(
                "Falha ao enviar e-mail de verificação do tipo {Tipo}. Causa: {Erro}.",
                tipo,
                ex.GetType().Name);
            throw new EmailDeliveryException(
                "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
                ex);
        }
    }

    private void ValidarConfiguracao()
    {
        if (string.IsNullOrWhiteSpace(_options.Host)
            || _options.Port is < 1 or > 65535
            || string.IsNullOrWhiteSpace(_options.User)
            || string.IsNullOrWhiteSpace(_options.Password)
            || string.IsNullOrWhiteSpace(_options.From)
            || string.IsNullOrWhiteSpace(_options.FromName))
        {
            var cause = new InvalidOperationException(
                "Configure Smtp:Host, Smtp:Port, Smtp:User, Smtp:Password, Smtp:From e Smtp:FromName.");
            throw new EmailDeliveryException(
                "Configuração SMTP incompleta. Configure as opções SMTP e tente novamente.",
                cause);
        }

        if (!MailboxAddress.TryParse(_options.From, out _)
            || !MailboxAddress.TryParse(_options.User, out _))
        {
            var cause = new InvalidOperationException(
                "Smtp:User e Smtp:From precisam ser endereços de e-mail válidos.");
            throw new EmailDeliveryException(
                "Configuração SMTP inválida. Confira Smtp:User e Smtp:From.",
                cause);
        }
    }
}
