using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Net;
using System.Net.Http.Json;
using Xunit.Abstractions;

namespace Tests
{
    public class MilUsuariosIntegrationTests
    {
        private readonly ITestOutputHelper _output;

        public MilUsuariosIntegrationTests(
            ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task MilUsuariosDiferentes_DevemCriarRegistros_SemErro500()
        {
            var serviceMock =
                new Mock<IRegistroGlicemiaService>();

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
                                _ => { });

                        services.AddScoped(
                            _ => serviceMock.Object
                        );
                    });
                });

            using var client =
                factory.CreateClient();

            var tarefas =
                new List<Task<HttpResponseMessage>>();

            for (int i = 1; i <= 1000; i++)
            {
                var request =
                    new HttpRequestMessage(
                        HttpMethod.Post,
                        "/api/registro-glicemia"
                    );

                request.Headers.Add(
                    "X-Test-UserId",
                    i.ToString()
                );

                request.Content =
                    JsonContent.Create(
                        new RegistroGlicemiaCreateDto
                        {
                            Glicemia = 120,
                            GlicemiaAcimaDoLimite = false,
                            Dose = 5,
                            Hora = new TimeSpan(12, 0, 0),
                            Refeicao = "Almoço",
                            Data = DateOnly.FromDateTime(
                                DateTime.Today
                            )
                        }
                    );

                tarefas.Add(
                    client.SendAsync(request)
                );
            }

            var respostas =
                await Task.WhenAll(tarefas);

            var quantidade500 =
                respostas.Count(
                    r => r.StatusCode ==
                         HttpStatusCode.InternalServerError
                );

            _output.WriteLine(
                $"500 Internal Server Error: {quantidade500}"
            );

            Assert.Equal(
                0,
                quantidade500
            );
        }
    }
}

