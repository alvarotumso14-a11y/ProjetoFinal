using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;
using System.Net;
using System.Net.Http.Json;

namespace Tests;

public class UsuarioEndpointsIntegrationTests
{
    [Fact]
    public async Task Swagger_DeveExporOsSeisEndpointsDoFluxoDeVerificacao()
    {
        using var factory = CriarFactory(new Mock<IUsuarioService>());
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var swagger = await response.Content.ReadAsStringAsync();
        Assert.Contains("/api/usuario/consultar-cadastro", swagger);
        Assert.Contains("/api/usuario/confirmar-email", swagger);
        Assert.Contains("/api/usuario/reenviar-codigo", swagger);
        Assert.Contains("/api/usuario/confirmar-novo-email", swagger);
        Assert.Contains("/api/usuario/recuperar-senha", swagger);
        Assert.Contains("/api/usuario/redefinir-senha", swagger);
    }

    [Fact]
    public async Task ConsultarCadastro_DeveRetornarOStatusEsperado()
    {
        var usuarioService = new Mock<IUsuarioService>();
        usuarioService
            .Setup(s => s.ConsultarCadastroAsync(It.IsAny<ConsultarCadastroDto>()))
            .ReturnsAsync(new ConsultarCadastroResponseDto { Status = "novo" });
        usuarioService
            .Setup(s => s.ConfirmarEmailAsync(It.IsAny<ConfirmarEmailDto>()))
            .Returns(Task.CompletedTask);
        usuarioService
            .Setup(s => s.ReenviarCodigoAsync(It.IsAny<ReenviarCodigoDto>()))
            .Returns(Task.CompletedTask);
        usuarioService
            .Setup(s => s.SolicitarRecuperacaoSenhaAsync(It.IsAny<RecuperarSenhaDto>()))
            .Returns(Task.CompletedTask);
        usuarioService
            .Setup(s => s.RedefinirSenhaAsync(It.IsAny<RedefinirSenhaDto>()))
            .Returns(Task.CompletedTask);
        usuarioService
            .Setup(s => s.ConfirmarNovoEmailAsync(1, It.IsAny<ConfirmarNovoEmailDto>()))
            .Returns(Task.CompletedTask);
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/usuario/consultar-cadastro",
            new { email = "nova@example.test" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ConsultarCadastroResponseDto>();
        Assert.Equal("novo", body?.Status);
    }

    [Fact]
    public async Task ConsultarCadastro_DeveAplicarLimitePorOrigem()
    {
        var usuarioService = new Mock<IUsuarioService>();
        usuarioService
            .Setup(s => s.ConsultarCadastroAsync(It.IsAny<ConsultarCadastroDto>()))
            .ReturnsAsync(new ConsultarCadastroResponseDto { Status = "novo" });
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();
        var statuses = new List<HttpStatusCode>();

        for (var i = 0; i < 6; i++)
        {
            using var response = await client.PostAsJsonAsync(
                "/api/usuario/consultar-cadastro",
                new { email = $"nova{i}@example.test" });
            statuses.Add(response.StatusCode);
        }

        Assert.All(statuses.Take(5), status => Assert.Equal(HttpStatusCode.OK, status));
        Assert.Equal(HttpStatusCode.TooManyRequests, statuses[5]);
        usuarioService.Verify(
            s => s.ConsultarCadastroAsync(It.IsAny<ConsultarCadastroDto>()),
            Times.Exactly(5));
    }

    [Fact]
    public async Task CadastroDeMenorSemConsentimentoDoResponsavel_DeveSerRejeitado()
    {
        var usuarioService = new Mock<IUsuarioService>();
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/usuario",
            new
            {
                name = "Menor",
                email = "menor@example.test",
                senha = "senha-segura-123",
                tipoDiabetes = "Tipo 1",
                idade = 17,
                fatorSensibilidade = 50,
                hgtAlvo = 100,
                aceitouTermos = true,
                consentiuDadosSaude = true,
                responsavelNome = " ",
                consentimentoResponsavel = false
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        usuarioService.Verify(s => s.CreateAsync(It.IsAny<UsuarioCreateDto>()), Times.Never);
    }

    [Fact]
    public async Task CadastroComFalhaDeEmail_DeveRetornar503ComMensagemDeFalha()
    {
        var usuarioService = new Mock<IUsuarioService>();
        usuarioService
            .Setup(s => s.CreateAsync(It.IsAny<UsuarioCreateDto>()))
            .ThrowsAsync(new EmailDeliveryException(
                "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
                new InvalidOperationException("SMTP indisponível.")));
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/usuario", new
        {
            name = "Novo",
            email = "novo@example.test",
            senha = "senha-segura-123",
            tipoDiabetes = "Tipo 1",
            idade = 25,
            fatorSensibilidade = 50,
            hgtAlvo = 100,
            aceitouTermos = true,
            consentiuDadosSaude = true
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Contains(
            "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
            await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public void WebApplicationFactory_DeveSubstituirEnvioRealPorFake()
    {
        using var factory = CriarFactory(new Mock<IUsuarioService>());

        Assert.IsType<FakeEmailService>(
            factory.Services.GetRequiredService<IEmailService>());
    }

    [Fact]
    public async Task RecuperacaoComFalhaDeEmail_DeveManterRespostaGenerica()
    {
        var usuarioService = new Mock<IUsuarioService>();
        usuarioService
            .Setup(s => s.SolicitarRecuperacaoSenhaAsync(It.IsAny<RecuperarSenhaDto>()))
            .ThrowsAsync(new EmailDeliveryException(
                "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
                new InvalidOperationException("SMTP indisponível.")));
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/usuario/recuperar-senha",
            new { email = "pessoa@example.test" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(
            "Se houver uma conta ativa para este e-mail",
            await response.Content.ReadAsStringAsync());
        Assert.DoesNotContain("SMTP", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task EndpointsDeCodigo_DevemAceitarOsPayloadsDoFrontend()
    {
        var usuarioService = new Mock<IUsuarioService>();
        usuarioService
            .Setup(s => s.CreateAsync(It.IsAny<UsuarioCreateDto>()))
            .ReturnsAsync((ResultadoCriacaoUsuario.Sucesso, new CadastroPendenteDto
            {
                TentativaId = Guid.Parse("e4479129-8c55-4285-9bcc-f4782c3cfbee"),
                Email = "novo@example.test"
            }));
        usuarioService
            .Setup(s => s.ConsultarCadastroAsync(It.IsAny<ConsultarCadastroDto>()))
            .ReturnsAsync(new ConsultarCadastroResponseDto { Status = "novo" });
        using var factory = CriarFactory(usuarioService);
        using var client = factory.CreateClient();

        using var cadastro = await client.PostAsJsonAsync("/api/usuario", new
        {
            name = "Novo",
            email = "novo@example.test",
            senha = "senha-segura-123",
            tipoDiabetes = "Tipo 1",
            idade = 25,
            fatorSensibilidade = 50,
            hgtAlvo = 100,
            aceitouTermos = true,
            consentiuDadosSaude = true,
            responsavelNome = (string?)null,
            consentimentoResponsavel = false
        });

        Assert.Equal(HttpStatusCode.Created, cadastro.StatusCode);
        var corpoCadastro = await cadastro.Content.ReadFromJsonAsync<CadastroPendenteDto>();
        Assert.Equal(Guid.Parse("e4479129-8c55-4285-9bcc-f4782c3cfbee"), corpoCadastro?.TentativaId);

        using var confirmar = await client.PostAsJsonAsync("/api/usuario/confirmar-email", new
        {
            email = "novo@example.test",
            codigo = "123456",
            tentativaId = corpoCadastro!.TentativaId
        });
        using var reenviar = await client.PostAsJsonAsync(
            "/api/usuario/reenviar-codigo",
            new { email = "novo@example.test" });
        using var recuperar = await client.PostAsJsonAsync(
            "/api/usuario/recuperar-senha",
            new { email = "novo@example.test" });
        using var redefinir = await client.PostAsJsonAsync("/api/usuario/redefinir-senha", new
        {
            email = "novo@example.test",
            codigo = "123456",
            novaSenha = "senha-segura-456"
        });
        using var confirmarNovo = await client.PostAsJsonAsync(
            "/api/usuario/confirmar-novo-email",
            new { codigo = "123456" });

        Assert.Equal(HttpStatusCode.OK, confirmar.StatusCode);
        Assert.Equal(HttpStatusCode.OK, reenviar.StatusCode);
        Assert.Equal(HttpStatusCode.OK, recuperar.StatusCode);
        Assert.Contains(
            "Se houver uma conta ativa para este e-mail",
            await recuperar.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, redefinir.StatusCode);
        Assert.Equal(HttpStatusCode.OK, confirmarNovo.StatusCode);
        usuarioService.Verify(s => s.ConfirmarEmailAsync(It.IsAny<ConfirmarEmailDto>()), Times.Once);
        usuarioService.Verify(s => s.ReenviarCodigoAsync(It.IsAny<ReenviarCodigoDto>()), Times.Once);
        usuarioService.Verify(s => s.SolicitarRecuperacaoSenhaAsync(It.IsAny<RecuperarSenhaDto>()), Times.Once);
        usuarioService.Verify(s => s.RedefinirSenhaAsync(It.IsAny<RedefinirSenhaDto>()), Times.Once);
        usuarioService.Verify(s => s.ConfirmarNovoEmailAsync(1, It.IsAny<ConfirmarNovoEmailDto>()), Times.Once);
    }

    private static WebApplicationFactory<Program> CriarFactory(Mock<IUsuarioService> usuarioService)
    {
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services
                        .AddAuthentication(options =>
                        {
                            options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                            options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                        })
                        .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                            TestAuthHandler.SchemeName,
                            _ => { });
                    services.RemoveAll<IUsuarioService>();
                    services.AddScoped(_ => usuarioService.Object);
                    services.RemoveAll<IEmailService>();
                    services.AddSingleton<FakeEmailService>();
                    services.AddSingleton<IEmailService>(
                        provider => provider.GetRequiredService<FakeEmailService>());
                });
            });
    }
}
