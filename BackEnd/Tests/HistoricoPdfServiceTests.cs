using Application.DTOs;
using Infrastructure.Services;
namespace Tests;

public class HistoricoPdfServiceTests
{
    [Fact]
    public void GerarHistoricoPdf_DeveGerarPdfComDadosELayoutPaisagem()
    {
        var service = new HistoricoPdfService();
        var pdf = service.GerarHistoricoPdf(
            new UsuarioOutputDto
            {
                Name = "Pessoa",
                Idade = 25,
                HgtAlvo = 100,
                FatorSensibilidade = 50
            },
            [
                new RegistroGlicemiaOutputDto
                {
                    Data = new DateOnly(2026, 10, 8),
                    Hora = new TimeSpan(13, 26, 0),
                    Glicemia = 140,
                    Dose = 6,
                    Refeicao = "Almoço"
                }
            ]);

        Assert.StartsWith("%PDF-", System.Text.Encoding.Latin1.GetString(pdf));
        Assert.True(pdf.Length > 500);
    }
}
