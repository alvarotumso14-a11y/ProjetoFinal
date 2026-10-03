using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Interfaces;
using Moq;

namespace Tests
{
    public class UsuarioServiceTests
    {
        [Fact]
        public async Task CreateAsync_DeveRetornarEmailJaExiste_QuandoEmailJaCadastrado()
        {
            // Arrange
            var repositoryMock = new Mock<IUsuarioRepository>();
            var tokenServiceMock = new Mock<ITokenService>();

            repositoryMock
                .Setup(r => r.GetByEmailAsync("teste@email.com"))
                .ReturnsAsync(new Usuario
                {
                    Id = 1,
                    Name = "Teste",
                    Email = "teste@email.com"
                });

            var service = new UsuarioService(
                repositoryMock.Object,
                tokenServiceMock.Object
            );

            var dto = new UsuarioCreateDto
            {
                Name = "Novo Usuario",
                Email = "teste@email.com",
                Senha = "123456",
                TipoDiabetes = "Tipo 1",
                FatorSensibilidade = 50,
                HgtAlvo = 100
            };

            // Act
            var resultado = await service.CreateAsync(dto);

            // Assert
            Assert.Equal(
                ResultadoCriacaoUsuario.EmailJaExiste,
                resultado.Resultado
            );

            Assert.Null(resultado.Usuario);

            repositoryMock.Verify(
                r => r.AddAsync(It.IsAny<Usuario>()),
                Times.Never
            );

            repositoryMock.Verify(
                r => r.SaveChangesAsync(),
                Times.Never
            );
        }

        [Fact]
        public async Task LoginAsync_DeveRetornarNull_QuandoUsuarioEstiverInativo()
        {
            // Arrange
            var repositoryMock = new Mock<IUsuarioRepository>();
            var tokenServiceMock = new Mock<ITokenService>();

            var usuario = new Usuario
            {
                Id = 1,
                Name = "Usuario Teste",
                Email = "teste@email.com",
                Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
                Ativo = false
            };

            repositoryMock
                .Setup(r => r.GetByEmailAsync("teste@email.com"))
                .ReturnsAsync(usuario);

            var service = new UsuarioService(
                repositoryMock.Object,
                tokenServiceMock.Object
            );

            var dto = new LoginDto
            {
                Email = "teste@email.com",
                Senha = "123456"
            };

            // Act
            var resultado = await service.LoginAsync(dto);

            // Assert
            Assert.Null(resultado);

            tokenServiceMock.Verify(
                t => t.GenerateToken(It.IsAny<Usuario>()),
                Times.Never
            );
        }
    }
}