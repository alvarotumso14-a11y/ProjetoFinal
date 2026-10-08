using Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class LogEmailService : IEmailService
{
    private readonly ILogger<LogEmailService> _logger;
    private readonly IHostEnvironment _environment;

    public LogEmailService(
        ILogger<LogEmailService> logger,
        IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public Task EnviarCodigoAsync(
        string destinatario,
        string nome,
        string codigo,
        TipoCodigoEmail tipo,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "LogEmailService só pode ser usado no ambiente Development.");
        }

        _logger.LogInformation(
            "SMTP ausente em Development. Código {Tipo} para {Email}: {Codigo}",
            tipo,
            destinatario,
            codigo);
        return Task.CompletedTask;
    }
}
