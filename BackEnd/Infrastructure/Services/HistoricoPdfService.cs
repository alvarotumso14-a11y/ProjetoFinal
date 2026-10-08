using Application.DTOs;
using Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Infrastructure.Services
{
    public class HistoricoPdfService : IHistoricoPdfService
    {
        public byte[] GerarHistoricoPdf(
            UsuarioOutputDto usuario,
            List<RegistroGlicemiaOutputDto> registros)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var glicemiasNumericas = registros
                .Where(r => r.Glicemia.HasValue)
                .Select(r => r.Glicemia!.Value)
                .ToList();

            var menorGlicemia = glicemiasNumericas.Any()
                ? glicemiasNumericas.Min().ToString()
                : "-";

            var maiorGlicemia = glicemiasNumericas.Any()
                ? glicemiasNumericas.Max().ToString()
                : "-";

            var documento = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(35);

                    page.Header().Column(column =>
                    {
                        column.Item()
                            .Text("GlicHelp")
                            .FontSize(24)
                            .FontColor("#d32f2f")
                            .Bold();

                        column.Item()
                            .Text("Histórico de Glicemia")
                            .FontSize(18)
                            .Bold();

                        column.Item()
                            .PaddingTop(10)
                            .Text($"Nome: {usuario.Name}");

                        column.Item()
                            .Text(
                                $"Idade: {usuario.Idade?.ToString() ?? "Não informada"}"
                            );

                        column.Item()
                            .Text($"HGT alvo: {usuario.HgtAlvo} mg/dL");

                        column.Item()
                            .Text(
                                $"Fator de sensibilidade: {usuario.FatorSensibilidade}"
                            );

                        column.Item()
                            .PaddingTop(5)
                            .Text(
                                $"Relatório gerado em {DateTime.Now:dd/MM/yyyy HH:mm}"
                            )
                            .FontSize(10);
                    });

                    page.Content()
                        .PaddingVertical(20)
                        .Column(column =>
                        {
                            column.Spacing(20);

                            column.Item().Row(row =>
                            {
                                row.RelativeItem()
                                    .Border(1)
                                    .Padding(10)
                                    .Column(card =>
                                    {
                                        card.Item()
                                            .Text("Total de registros")
                                            .FontSize(10);

                                        card.Item()
                                            .Text(registros.Count.ToString())
                                            .FontSize(18)
                                            .Bold();
                                    });

                                row.ConstantItem(10);

                                row.RelativeItem()
                                    .Border(1)
                                    .Padding(10)
                                    .Column(card =>
                                    {
                                        card.Item()
                                            .Text("Menor glicemia")
                                            .FontSize(10);

                                        card.Item()
                                            .Text(menorGlicemia)
                                            .FontSize(18)
                                            .Bold();
                                    });

                                row.ConstantItem(10);

                                row.RelativeItem()
                                    .Border(1)
                                    .Padding(10)
                                    .Column(card =>
                                    {
                                        card.Item()
                                            .Text("Maior glicemia")
                                            .FontSize(10);

                                        card.Item()
                                            .Text(maiorGlicemia)
                                            .FontSize(18)
                                            .Bold();
                                    });
                            });

                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(82);
                                    columns.ConstantColumn(70);
                                    columns.ConstantColumn(75);
                                    columns.ConstantColumn(55);
                                    columns.ConstantColumn(120);
                                    columns.RelativeColumn();
                                });

                                table.Header(header =>
                                {
                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Data")
                                        .Bold();

                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Hora")
                                        .Bold();

                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Glicemia")
                                        .Bold();

                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Dose")
                                        .Bold();

                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Refeição")
                                        .Bold();

                                    header.Cell()
                                        .BorderBottom(1)
                                        .Padding(6)
                                        .Text("Observação")
                                        .Bold();
                                });

                                foreach (var registro in registros)
                                {
                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(
                                            registro.Data.ToString("dd/MM/yyyy")
                                        );

                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(registro.Hora.ToString());

                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(
                                            registro.GlicemiaAcimaDoLimite
                                                ? "HI"
                                                : registro.Glicemia?.ToString() ?? "-"
                                        );

                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(registro.Dose.ToString());

                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(registro.Refeicao);

                                    table.Cell()
                                        .BorderBottom(0.5f)
                                        .Padding(6)
                                        .Text(
                                            string.IsNullOrWhiteSpace(
                                                registro.Observacao
                                            )
                                                ? "-"
                                                : registro.Observacao
                                        );
                                }
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("GlicHelp • Página ");
                            text.CurrentPageNumber();
                        });
                });
            });

            return documento.GeneratePdf();
        }
    }
}