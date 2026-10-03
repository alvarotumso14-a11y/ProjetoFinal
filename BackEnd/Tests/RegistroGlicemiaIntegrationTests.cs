using Application.DTOs;
using Xunit.Abstractions;
using Application.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Net;
using System.Net.Http.Json;

namespace Tests
{
    public class RegistroGlicemiaIntegrationTests
    {
        private readonly ITestOutputHelper _output;

        public RegistroGlicemiaIntegrationTests(
            ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task CriarRegistro_DeveSuportarMuitasRequisicoes_SemErro500()
        {
            // Arrange
            var serviceMock = new Mock<IRegistroGlicemiaService>();

            serviceMock
                .Setup(s => s.CreateAsync(
                    It.IsAny<RegistroGlicemiaCreateDto>(),
                    It.IsAny<int>()))
                .ReturnsAsync(new RegistroGlicemiaOutputDto
                {
                    Id = 1
                });

            using var factory =
                new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureTestServices(services =>
                    {
                        services
                            .AddAuthentication(options =>
                            {
                                options.DefaultAuthenticateScheme =
                                    TestAuthHandler.SchemeName;

                                options.DefaultChallengeScheme =
                                    TestAuthHandler.SchemeName;
                            })
                            .AddScheme<
                                AuthenticationSchemeOptions,
                                TestAuthHandler>(
                                TestAuthHandler.SchemeName,
                                options => { });

                        services.AddScoped(
                            _ => serviceMock.Object
                        );
                    });
                });

            using var client = factory.CreateClient();

            var dto = new RegistroGlicemiaCreateDto
            {
                Glicemia = 120,
                GlicemiaAcimaDoLimite = false,
                Dose = 5,
                Hora = new TimeSpan(12, 0, 0),
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today),
                Observacao = "Teste de concorrência"
            };

            var requisicoes =
                new List<Task<HttpResponseMessage>>();

            // Simula 100 cliques simultâneos
            for (int i = 0; i < 100; i++)
            {
                requisicoes.Add(
                    client.PostAsJsonAsync(
                        "/api/registro-glicemia",
                        dto
                    )
                );
            }

            // Act
            var respostas =
                await Task.WhenAll(requisicoes);

            var quantidade200 = respostas.Count(
                r => r.StatusCode ==
                     HttpStatusCode.OK
            );

            var quantidade201 = respostas.Count(
                r => r.StatusCode ==
                     HttpStatusCode.Created
            );

            var quantidade429 = respostas.Count(
                r => r.StatusCode ==
                     HttpStatusCode.TooManyRequests
            );

            var quantidade500 = respostas.Count(
                r => r.StatusCode ==
                     HttpStatusCode.InternalServerError
            );

            _output.WriteLine(
                $"200 OK: {quantidade200}"
            );

            _output.WriteLine(
                $"201 Created: {quantidade201}"
            );

            _output.WriteLine(
                $"429 Too Many Requests: {quantidade429}"
            );

            _output.WriteLine(
                $"500 Internal Server Error: {quantidade500}"
            );

            // Assert
            Assert.Equal(
                0,
                quantidade500
            );

            Assert.True(
                quantidade429 > 0,
                "O rate limiting deveria bloquear parte das requisições."
            );
        }
    }
}