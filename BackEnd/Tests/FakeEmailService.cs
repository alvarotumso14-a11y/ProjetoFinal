using Application.Interfaces;
using System.Collections.Concurrent;

namespace Tests;

public sealed record EmailCodigoEnviado(
    string Destinatario,
    string Nome,
    string Codigo,
    TipoCodigoEmail Tipo);

public sealed class FakeEmailService : IEmailService
{
    private readonly ConcurrentQueue<EmailCodigoEnviado> _envios = new();

    public IReadOnlyCollection<EmailCodigoEnviado> Envios => _envios.ToArray();
    public Exception? Falha { get; set; }
    public Action<EmailCodigoEnviado>? AoEnviar { get; set; }

    public Task EnviarCodigoAsync(
        string destinatario,
        string nome,
        string codigo,
        TipoCodigoEmail tipo,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (Falha != null)
        {
            throw Falha;
        }

        var envio = new EmailCodigoEnviado(destinatario, nome, codigo, tipo);
        _envios.Enqueue(envio);
        AoEnviar?.Invoke(envio);
        return Task.CompletedTask;
    }
}
