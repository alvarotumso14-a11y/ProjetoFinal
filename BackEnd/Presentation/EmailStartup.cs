using Infrastructure.Services;

namespace Presentation;

public static class EmailStartup
{
    public static void ValidarConfiguracao(bool isDevelopment, SmtpOptions options)
    {
        if (!isDevelopment && string.IsNullOrWhiteSpace(options.Password))
        {
            throw new InvalidOperationException(
                "Smtp:Password não configurado. Configure a senha de app do Gmail pela variável Smtp__Password antes de iniciar fora de Development.");
        }
    }
}
