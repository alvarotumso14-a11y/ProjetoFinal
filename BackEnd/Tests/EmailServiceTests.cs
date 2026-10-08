using Application.Interfaces;
using Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Moq;
using Presentation;

namespace Tests;

public class EmailServiceTests
{
    [Fact]
    public async Task LogEmailService_DeveRegistrarCodigoParaDesenvolvimento()
    {
        var logger = new Mock<ILogger<LogEmailService>>();
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(item => item.EnvironmentName).Returns(Environments.Development);
        var service = new LogEmailService(logger.Object, environment.Object);

        await service.EnviarCodigoAsync(
            "teste@example.test",
            "Pessoa",
            "123456",
            TipoCodigoEmail.ConfirmacaoEmail);

        logger.Verify(
            log => log.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) =>
                    state != null && state.ToString()!.Contains("123456")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task LogEmailService_ForaDeDevelopment_DeveRecusarRegistroDoCodigo()
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(item => item.EnvironmentName).Returns(Environments.Production);
        var service = new LogEmailService(
            Mock.Of<ILogger<LogEmailService>>(),
            environment.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.EnviarCodigoAsync(
                "teste@example.test",
                "Pessoa",
                "123456",
                TipoCodigoEmail.ConfirmacaoEmail));
    }

    [Fact]
    public async Task SmtpEmailService_SemConfiguracaoCompleta_DeveFalharSemEnviar()
    {
        var service = new SmtpEmailService(
            Options.Create(new SmtpOptions()),
            Mock.Of<ILogger<SmtpEmailService>>());

        var erro = await Assert.ThrowsAsync<EmailDeliveryException>(() =>
            service.EnviarCodigoAsync(
                "teste@example.test",
                "Pessoa",
                "123456",
                TipoCodigoEmail.ConfirmacaoEmail));

        Assert.Contains("Configuração SMTP incompleta", erro.Message);
        Assert.IsType<InvalidOperationException>(erro.InnerException);
    }

    [Fact]
    public void Template_DeveCodificarNomeEIncluirCodigoExpiracaoEAviso()
    {
        var template = EmailTemplates.Criar(
            "<script>alert(1)</script>",
            "123456",
            TipoCodigoEmail.RecuperacaoSenha);

        Assert.Contains("&lt;script&gt;", template.Html);
        Assert.DoesNotContain("<script>", template.Html);
        Assert.Contains("color:#d32f2f;letter-spacing:4px", template.Html);
        Assert.Contains("G l i c H e l p", template.Texto);
        Assert.Contains("123456", template.Html);
        Assert.Contains("15 minutos", template.Texto);
        Assert.Contains("pode ignorar", template.Texto);
        Assert.Contains("senha", template.Assunto, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProgramEmProducaoSemSenhaDeApp_DeveInformarConfigNecessaria()
    {
        var erro = Assert.Throws<InvalidOperationException>(() =>
            EmailStartup.ValidarConfiguracao(
                isDevelopment: false,
                new SmtpOptions()));

        Assert.Contains("Smtp:Password", erro.Message);
    }
}
