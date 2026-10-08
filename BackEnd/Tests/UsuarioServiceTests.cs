using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Exceptions;
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
            repositoryMock
                .Setup(r => r.GetByEmailOuEmailPendenteAsync("teste@email.com"))
                .ReturnsAsync(new Usuario
                {
                    Id = 1,
                    Name = "Teste",
                    Email = "teste@email.com",
                    EmailConfirmado = true
                });
            var codigoRepositoryMock = new Mock<ICodigoVerificacaoRepository>();
            var cadastroPendenteRepositoryMock = new Mock<ICadastroPendenteRepository>();
            var tokenServiceMock = new Mock<ITokenService>();
            var emailServiceMock = new Mock<IEmailService>();

            var service = new UsuarioService(
                repositoryMock.Object,
                codigoRepositoryMock.Object,
                cadastroPendenteRepositoryMock.Object,
                tokenServiceMock.Object,
                emailServiceMock.Object,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) }
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

            Assert.Null(resultado.Cadastro);

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
            var codigoRepositoryMock = new Mock<ICodigoVerificacaoRepository>();
            var cadastroPendenteRepositoryMock = new Mock<ICadastroPendenteRepository>();
            var tokenServiceMock = new Mock<ITokenService>();
            var emailServiceMock = new Mock<IEmailService>();

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
                codigoRepositoryMock.Object,
                cadastroPendenteRepositoryMock.Object,
                tokenServiceMock.Object,
                emailServiceMock.Object,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) }
            );

            var dto = new LoginDto
            {
                Email = "teste@email.com",
                Senha = "123456"
            };

            // Act
            var resultado = await service.LoginAsync(dto);

            // Assert
            Assert.Null(resultado.Resposta);

            tokenServiceMock.Verify(
                t => t.GenerateToken(It.IsAny<Usuario>()),
                Times.Never
            );
        }

        [Fact]
        public async Task CreateAsync_DeveCriarContaSomenteAposConfirmarCodigo()
        {
            var usuarioRepository = new Mock<IUsuarioRepository>();
            var codigoRepository = new Mock<ICodigoVerificacaoRepository>();
            var cadastroPendenteRepository = new Mock<ICadastroPendenteRepository>();
            var emailService = new FakeEmailService();
            CadastroPendente? cadastroCriado = null;
            Usuario? usuarioCriado = null;
            var cadastroRemovido = false;
            var ordemPersistenciaEnvio = new List<string>();
            emailService.AoEnviar = _ => ordemPersistenciaEnvio.Add("enviar");

            usuarioRepository
                .Setup(r => r.GetByEmailOuEmailPendenteAsync("novo@email.com"))
                .ReturnsAsync((Usuario?)null);
            usuarioRepository
                .Setup(r => r.GetByEmailAsync("novo@email.com"))
                .ReturnsAsync(() => usuarioCriado);
            usuarioRepository
                .Setup(r => r.AddAsync(It.IsAny<Usuario>()))
                .Callback<Usuario>(usuario => usuarioCriado = usuario)
                .Returns(Task.CompletedTask);
            cadastroPendenteRepository
                .Setup(r => r.GetByEmailAsync("novo@email.com"))
                .ReturnsAsync((CadastroPendente?)null);
            cadastroPendenteRepository
                .Setup(r => r.AddAsync(It.IsAny<CadastroPendente>()))
                .Callback<CadastroPendente>(cadastro => cadastroCriado = cadastro)
                .Returns(Task.CompletedTask);
            cadastroPendenteRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(() => cadastroRemovido ? null : cadastroCriado);
            cadastroPendenteRepository
                .Setup(r => r.Remove(It.IsAny<CadastroPendente>()))
                .Callback(() => cadastroRemovido = true);
            usuarioRepository
                .Setup(r => r.SaveChangesAsync())
                .Callback(() => ordemPersistenciaEnvio.Add("salvar"))
                .Returns(Task.CompletedTask);
            var service = new UsuarioService(
                usuarioRepository.Object,
                codigoRepository.Object,
                cadastroPendenteRepository.Object,
                Mock.Of<ITokenService>(),
                emailService,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            var resultado = await service.CreateAsync(new UsuarioCreateDto
            {
                Name = "Novo",
                Email = "NOVO@email.com",
                Senha = "senha-valida-123",
                TipoDiabetes = "Tipo 1",
                Idade = 20,
                FatorSensibilidade = 50,
                HgtAlvo = 100,
                AceitouTermos = true,
                ConsentiuDadosSaude = true
            });

            Assert.Equal(ResultadoCriacaoUsuario.Sucesso, resultado.Resultado);
            Assert.NotNull(resultado.Cadastro);
            Assert.NotEqual(Guid.Empty, resultado.Cadastro!.TentativaId);
            Assert.Null(usuarioCriado);
            Assert.NotNull(cadastroCriado);
            Assert.True(cadastroCriado!.AceitouTermos);
            Assert.True(cadastroCriado.ConsentiuDadosSaude);
            Assert.Equal(resultado.Cadastro.TentativaId, cadastroCriado.Id);
            var envio = Assert.Single(emailService.Envios);
            var codigoEnviado = envio.Codigo;
            Assert.Equal("novo@email.com", envio.Destinatario);
            Assert.Equal("Novo", envio.Nome);
            Assert.Equal(TipoCodigoEmail.ConfirmacaoEmail, envio.Tipo);
            Assert.Matches(@"^\d{6}$", codigoEnviado);
            Assert.DoesNotContain(codigoEnviado, cadastroCriado.CodigoHash);
            Assert.True(BCrypt.Net.BCrypt.Verify("senha-valida-123", cadastroCriado.SenhaHash));
            Assert.Equal(new[] { "salvar", "enviar" }, ordemPersistenciaEnvio);
            usuarioRepository.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Never);

            await service.ConfirmarEmailAsync(new ConfirmarEmailDto
            {
                Email = "novo@email.com",
                Codigo = codigoEnviado,
                TentativaId = resultado.Cadastro.TentativaId
            });
            Assert.NotNull(usuarioCriado);
            Assert.True(usuarioCriado!.EmailConfirmado);
            Assert.Equal("novo@email.com", usuarioCriado.Email);
            Assert.True(cadastroRemovido);
            usuarioRepository.Verify(r => r.AddAsync(It.IsAny<Usuario>()), Times.Once);
            await Assert.ThrowsAsync<CodigoVerificacaoException>(() =>
                service.ConfirmarEmailAsync(new ConfirmarEmailDto
                {
                    Email = "novo@email.com",
                    Codigo = codigoEnviado,
                    TentativaId = resultado.Cadastro.TentativaId
                }));
        }

        [Fact]
        public async Task LoginAsync_DeveSinalizarEmailNaoConfirmado_AposValidarSenha()
        {
            var usuario = new Usuario
            {
                Id = 7,
                Email = "pendente@email.com",
                Senha = BCrypt.Net.BCrypt.HashPassword("senha-correta"),
                EmailConfirmado = false,
                Ativo = true
            };
            var repository = new Mock<IUsuarioRepository>();
            repository.Setup(r => r.GetByEmailAsync(usuario.Email)).ReturnsAsync(usuario);
            var tokenService = new Mock<ITokenService>();

            var service = new UsuarioService(
                repository.Object,
                Mock.Of<ICodigoVerificacaoRepository>(),
                Mock.Of<ICadastroPendenteRepository>(),
                tokenService.Object,
                Mock.Of<IEmailService>(),
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            var result = await service.LoginAsync(new LoginDto
            {
                Email = usuario.Email,
                Senha = "senha-correta"
            });

            Assert.True(result.EmailNaoConfirmado);
            Assert.Null(result.Resposta);
            tokenService.Verify(t => t.GenerateToken(It.IsAny<Usuario>()), Times.Never);
        }

        [Fact]
        public async Task RedefinirSenhaAsync_DeveBloquearCodigoAposCincoTentativas()
        {
            var usuario = new Usuario
            {
                Id = 9,
                Email = "recuperar@email.com",
                Senha = BCrypt.Net.BCrypt.HashPassword("senha-antiga"),
                Ativo = true
            };
            var codigo = new CodigoVerificacao
            {
                UsuarioId = usuario.Id,
                Tipo = TipoCodigoVerificacao.RecuperacaoSenha,
                CodigoHash = "hash-invalido",
                ExpiraEm = DateTime.UtcNow.AddMinutes(15),
                CriadoEm = DateTime.UtcNow
            };
            var usuarioRepository = new Mock<IUsuarioRepository>();
            usuarioRepository.Setup(r => r.GetByEmailAsync(usuario.Email)).ReturnsAsync(usuario);
            var codigoRepository = new Mock<ICodigoVerificacaoRepository>();
            codigoRepository
                .Setup(r => r.GetAtivosAsync(usuario.Id, TipoCodigoVerificacao.RecuperacaoSenha))
                .ReturnsAsync([codigo]);
            codigoRepository.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var service = new UsuarioService(
                usuarioRepository.Object,
                codigoRepository.Object,
                Mock.Of<ICadastroPendenteRepository>(),
                Mock.Of<ITokenService>(),
                Mock.Of<IEmailService>(),
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            for (var tentativa = 0; tentativa < 6; tentativa++)
            {
                await Assert.ThrowsAsync<CodigoVerificacaoException>(() =>
                    service.RedefinirSenhaAsync(new RedefinirSenhaDto
                    {
                        Email = usuario.Email,
                        Codigo = "123456",
                        NovaSenha = "senha-nova-123"
                    }));
            }

            Assert.Equal(5, codigo.Tentativas);
            codigoRepository.Verify(r => r.SaveChangesAsync(), Times.Exactly(5));
        }

        [Fact]
        public void SenhaValidaAttribute_DeveAplicarLimitesDeCaracteresEBytesUtf8()
        {
            var validador = new SenhaValidaAttribute();

            Assert.True(validador.IsValid(new string('a', 64)));
            Assert.False(validador.IsValid(new string('a', 65)));
            Assert.True(validador.IsValid(new string('é', 36)));
            Assert.False(validador.IsValid(new string('é', 37)));
        }

        [Fact]
        public async Task CreateAsync_DevePropagarFalhaDeEmailDepoisDePersistirTentativa()
        {
            var usuarioRepository = new Mock<IUsuarioRepository>();
            var codigoRepository = new Mock<ICodigoVerificacaoRepository>();
            var cadastroPendenteRepository = new Mock<ICadastroPendenteRepository>();
            usuarioRepository
                .Setup(r => r.GetByEmailOuEmailPendenteAsync("novo@email.com"))
                .ReturnsAsync((Usuario?)null);
            cadastroPendenteRepository
                .Setup(r => r.GetByEmailAsync("novo@email.com"))
                .ReturnsAsync((CadastroPendente?)null);
            cadastroPendenteRepository
                .Setup(r => r.AddAsync(It.IsAny<CadastroPendente>()))
                .Returns(Task.CompletedTask);
            usuarioRepository
                .Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);
            var emailService = new Mock<IEmailService>();
            emailService
                .Setup(s => s.EnviarCodigoAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<TipoCodigoEmail>(),
                    It.IsAny<CancellationToken>()))
                .ThrowsAsync(new EmailDeliveryException(
                    "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
                    new InvalidOperationException("SMTP indisponível.")));

            var service = new UsuarioService(
                usuarioRepository.Object,
                codigoRepository.Object,
                cadastroPendenteRepository.Object,
                Mock.Of<ITokenService>(),
                emailService.Object,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            await Assert.ThrowsAsync<EmailDeliveryException>(() => service.CreateAsync(new UsuarioCreateDto
            {
                Name = "Novo",
                Email = "novo@email.com",
                Senha = "senha-valida-123",
                TipoDiabetes = "Tipo 1",
                Idade = 20,
                FatorSensibilidade = 50,
                HgtAlvo = 100,
                AceitouTermos = true,
                ConsentiuDadosSaude = true
            }));
            usuarioRepository.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task ReenviarCodigoAsync_DeveRespeitarIntervaloDe60Segundos()
        {
            var usuarioRepository = new Mock<IUsuarioRepository>();
            usuarioRepository
                .Setup(r => r.GetByEmailOuEmailPendenteAsync("novo@email.com"))
                .ReturnsAsync((Usuario?)null);
            var cadastroPendente = new CadastroPendente
            {
                Id = Guid.NewGuid(),
                Email = "novo@email.com",
                CriadoEm = DateTime.UtcNow
            };
            var cadastroPendenteRepository = new Mock<ICadastroPendenteRepository>();
            cadastroPendenteRepository
                .Setup(r => r.GetByEmailAsync("novo@email.com"))
                .ReturnsAsync(cadastroPendente);
            var emailService = new FakeEmailService();
            var service = new UsuarioService(
                usuarioRepository.Object,
                Mock.Of<ICodigoVerificacaoRepository>(),
                cadastroPendenteRepository.Object,
                Mock.Of<ITokenService>(),
                emailService,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            var erro = await Assert.ThrowsAsync<IntervaloReenvioException>(() =>
                service.ReenviarCodigoAsync(new ReenviarCodigoDto { Email = cadastroPendente.Email }));

            Assert.Contains("60 segundos", erro.Message);
            Assert.Empty(emailService.Envios);
        }

        [Fact]
        public async Task RecuperacaoSenhaAsync_DeveEnviarNovoCodigoAposIntervalo()
        {
            var usuario = new Usuario
            {
                Id = 17,
                Name = "Pessoa",
                Email = "pessoa@email.com",
                Ativo = true
            };
            var usuarioRepository = new Mock<IUsuarioRepository>();
            usuarioRepository
                .Setup(r => r.GetByEmailAsync(usuario.Email))
                .ReturnsAsync(usuario);
            usuarioRepository
                .Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);
            var codigoRepository = new Mock<ICodigoVerificacaoRepository>();
            codigoRepository
                .Setup(r => r.GetMaisRecenteAsync(
                    usuario.Id,
                    TipoCodigoVerificacao.RecuperacaoSenha))
                .ReturnsAsync(new CodigoVerificacao
                {
                    CriadoEm = DateTime.UtcNow.AddMinutes(-2)
                });
            codigoRepository
                .Setup(r => r.GetAtivosAsync(
                    usuario.Id,
                    TipoCodigoVerificacao.RecuperacaoSenha))
                .ReturnsAsync([]);
            codigoRepository
                .Setup(r => r.AddAsync(It.IsAny<CodigoVerificacao>()))
                .Returns(Task.CompletedTask);
            var emailService = new FakeEmailService();
            var service = new UsuarioService(
                usuarioRepository.Object,
                codigoRepository.Object,
                Mock.Of<ICadastroPendenteRepository>(),
                Mock.Of<ITokenService>(),
                emailService,
                new CodigoVerificacaoOpcoes { ChaveHash = new string('k', 32) });

            await service.SolicitarRecuperacaoSenhaAsync(
                new RecuperarSenhaDto { Email = usuario.Email });

            var envio = Assert.Single(emailService.Envios);
            Assert.Equal(usuario.Email, envio.Destinatario);
            Assert.Equal(usuario.Name, envio.Nome);
            Assert.Equal(TipoCodigoEmail.RecuperacaoSenha, envio.Tipo);
            Assert.Matches(@"^\d{6}$", envio.Codigo);
        }
    }
}