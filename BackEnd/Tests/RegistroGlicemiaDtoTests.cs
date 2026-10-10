using Application.DTOs;
using System.ComponentModel.DataAnnotations;

namespace Tests
{
    public class RegistroGlicemiaDtoTests
    {
        [Fact]
        public void DoseMeiaUnidade_DeveSerPreservadaNoDto()
        {
            var dto = new RegistroGlicemiaCreateDto
            {
                Dose = 0.5m,
                Glicemia = 120,
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };

            Assert.Equal(0.5m, dto.Dose);
            var erros = new List<ValidationResult>();
            var valido = Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true);

            Assert.True(valido);
        }

        [Fact]
        public void JsonComDoseDecimal_DeveSerAceito()
        {
            const string json = """
                {
                    "glicemia": 120,
                    "dose": 0.6,
                    "hora": "12:00:00",
                    "refeicao": "Almoço",
                    "data": "2026-10-10"
                }
                """;
            var dto = System.Text.Json.JsonSerializer.Deserialize<RegistroGlicemiaCreateDto>(
                json,
                new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));

            Assert.NotNull(dto);
            Assert.Equal(0.6m, dto.Dose);
            var erros = new List<ValidationResult>();
            Assert.True(Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true));
        }

        [Theory]
        [InlineData(0.65)]
        [InlineData(0.25)]
        public void DoseComMaisDeUmaCasaDecimal_DeveSerRejeitada(double dose)
        {
            var dto = new RegistroGlicemiaCreateDto
            {
                Dose = (decimal)dose,
                Glicemia = 120,
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };
            var erros = new List<ValidationResult>();

            var valido = Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true);

            Assert.False(valido);
            Assert.Contains(erros, erro => erro.MemberNames.Contains(nameof(dto.Dose)));
        }

        [Fact]
        public void DoseMeiaUnidade_DeveSerAceitaNaEdicaoDoHistorico()
        {
            var dto = new RegistroGlicemiaUpdateDto
            {
                Dose = 1.5m,
                Glicemia = 120,
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };
            var erros = new List<ValidationResult>();

            var valido = Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true);

            Assert.True(valido);
        }

        [Fact]
        public void DoseComMaisDeUmaCasaDecimal_DeveSerRejeitadaNaEdicaoDoHistorico()
        {
            var dto = new RegistroGlicemiaUpdateDto
            {
                Dose = 0.65m,
                Glicemia = 120,
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };
            var erros = new List<ValidationResult>();

            var valido = Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true);

            Assert.False(valido);
            Assert.Contains(erros, erro => erro.MemberNames.Contains(nameof(dto.Dose)));
        }

        [Fact]
        public void DeveSerValido_QuandoGlicemiaForHI()
        {
            // Arrange
            var dto = new RegistroGlicemiaCreateDto
            {
                Glicemia = null,
                GlicemiaAcimaDoLimite = true,
                Dose = 10,
                Hora = new TimeSpan(12, 0, 0),
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };

            var contexto = new ValidationContext(dto);
            var erros = new List<ValidationResult>();

            // Act
            var valido = Validator.TryValidateObject(
                dto,
                contexto,
                erros,
                true
            );

            // Assert
            Assert.True(valido);
            Assert.Empty(erros);
        }

        [Fact]
        public void DeveSerInvalido_QuandoHIETiverValorNumerico()
        {
            var dto = new RegistroGlicemiaCreateDto
            {
                Glicemia = 250,
                GlicemiaAcimaDoLimite = true,
                Dose = 10,
                Hora = new TimeSpan(12, 0, 0),
                Refeicao = "Almoço",
                Data = DateOnly.FromDateTime(DateTime.Today)
            };

            var contexto = new ValidationContext(dto);
            var erros = new List<ValidationResult>();

            var valido = Validator.TryValidateObject(
                dto,
                contexto,
                erros,
                true
            );

            Assert.False(valido);
            Assert.NotEmpty(erros);
        }
    }
}