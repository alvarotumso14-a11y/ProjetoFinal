using Application.DTOs;
using System.ComponentModel.DataAnnotations;

namespace Tests
{
    public class RegistroGlicemiaDtoTests
    {
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