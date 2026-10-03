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
using Xunit.Abstractions;

namespace Tests
{
    public class RateLimitTests
    {
        private readonly ITestOutputHelper _output;

        public RateLimitTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task Login_DeveRetornar429_AposUltrapassarLimite()
        {
            using var factory = CriarFactoryDeTeste();
            using var client = factory.CreateClient();
            var login = new
            {
                Email = "teste@teste.com",
                Senha = "senhaerrada"
            };
            var respostas = new List<HttpResponseMessage>();

            for (int i = 0; i < 6; i++)
            {
                respostas.Add(await client.PostAsJsonAsync("/api/usuario/login", login));
            }

            Assert.Equal(HttpStatusCode.Unauthorized, respostas[4].StatusCode);
            Assert.Equal(HttpStatusCode.TooManyRequests, respostas[5].StatusCode);
            _output.WriteLine("5 tentativas processadas; a 6ª recebeu HTTP 429.");
        }

        [Fact]
        public async Task Api_DeveSuportarMultiplasRequisicoesSimultaneas_SemErro500()
        {
            using var factory = CriarFactoryDeTeste();
            using var client = factory.CreateClient();
            var requisicoes = Enumerable.Range(0, 20)
                .Select(_ => client.PostAsJsonAsync(
                    "/api/usuario/login",
                    new { Email = "teste@teste.com", Senha = "senhaerrada" }))
                .ToArray();

            var respostas = await Task.WhenAll(requisicoes);
            var quantidade500 = respostas.Count(r => r.StatusCode == HttpStatusCode.InternalServerError);
            var quantidade429 = respostas.Count(r => r.StatusCode == HttpStatusCode.TooManyRequests);

            Assert.Equal(0, quantidade500);
            Assert.True(quantidade429 > 0, "O limite deve responder HTTP 429 ao excesso de tentativas.");
            _output.WriteLine($"Requisições simultâneas: {respostas.Length}; 429: {quantidade429}; 500: {quantidade500}.");
        }

        [Fact]
        public async Task Api_DeveSuportar500RequisicoesSimultaneas_SemErro500()
        {
            using var factory = CriarFactoryDeTeste();
            using var client = factory.CreateClient();
            var requisicoes = Enumerable.Range(0, 500)
                .Select(_ => client.PostAsJsonAsync(
                    "/api/usuario/login",
                    new { Email = "teste@teste.com", Senha = "senhaerrada" }))
                .ToArray();

            var respostas = await Task.WhenAll(requisicoes);
            var quantidade500 = respostas.Count(r => r.StatusCode == HttpStatusCode.InternalServerError);
            var quantidade429 = respostas.Count(r => r.StatusCode == HttpStatusCode.TooManyRequests);

            Assert.Equal(0, quantidade500);
            Assert.True(quantidade429 > 0, "O limite deve responder HTTP 429 ao excesso de tentativas.");
            _output.WriteLine($"Requisições simultâneas: {respostas.Length}; 429: {quantidade429}; 500: {quantidade500}.");
        }

        private static WebApplicationFactory<Program> CriarFactoryDeTeste()
        {
            var usuarioService = new Mock<IUsuarioService>();
            usuarioService
                .Setup(service => service.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync((LoginResponseDto?)null);

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
                    });
                });
        }
    }
}
