using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace Application.Services;

public class UsuarioService : IUsuarioService
{
    private static readonly TimeSpan ValidadeCodigo = TimeSpan.FromMinutes(15);
    private const int MaxTentativasCodigo = 5;

    private readonly IUsuarioRepository _repository;
    private readonly ICodigoVerificacaoRepository _codigoRepository;
    private readonly ICadastroPendenteRepository _cadastroPendenteRepository;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly CodigoVerificacaoOpcoes _codigoOpcoes;

    public UsuarioService(
        IUsuarioRepository repository,
        ICodigoVerificacaoRepository codigoRepository,
        ICadastroPendenteRepository cadastroPendenteRepository,
        ITokenService tokenService,
        IEmailService emailService,
        CodigoVerificacaoOpcoes codigoOpcoes)
    {
        _repository = repository;
        _codigoRepository = codigoRepository;
        _cadastroPendenteRepository = cadastroPendenteRepository;
        _tokenService = tokenService;
        _emailService = emailService;
        _codigoOpcoes = codigoOpcoes;
    }

    public async Task<(ResultadoCriacaoUsuario Resultado, CadastroPendenteDto? Cadastro)> CreateAsync(
        UsuarioCreateDto dto)
    {
        var email = NormalizarEmail(dto.Email);
        var existente = await _repository.GetByEmailOuEmailPendenteAsync(email);
        if (existente != null)
        {
            if (!existente.Ativo || existente.EmailConfirmado
                || !string.Equals(existente.Email, email, StringComparison.OrdinalIgnoreCase))
            {
                return (ResultadoCriacaoUsuario.EmailJaExiste, null);
            }

            await GarantirIntervaloReenvioAsync(
                existente.Id,
                TipoCodigoVerificacao.ConfirmacaoEmail);
            var anterior = await _codigoRepository.GetMaisRecenteAsync(
                existente.Id,
                TipoCodigoVerificacao.ConfirmacaoEmail);
            var tentativaIdExistente = anterior?.TentativaId ?? Guid.NewGuid();
            var (_, codigoExistente) = await CriarCodigoAsync(
                existente,
                TipoCodigoVerificacao.ConfirmacaoEmail,
                tentativaIdExistente);
            await _repository.SaveChangesAsync();
            await _emailService.EnviarCodigoAsync(
                existente.Email,
                existente.Name,
                codigoExistente,
                TipoCodigoEmail.ConfirmacaoEmail);
            return (ResultadoCriacaoUsuario.Sucesso, new CadastroPendenteDto
            {
                TentativaId = tentativaIdExistente,
                Email = existente.Email,
                EmailEnviado = true
            });
        }

        var cadastroExistente = await _cadastroPendenteRepository.GetByEmailAsync(email);
        if (cadastroExistente != null)
        {
            GarantirIntervaloReenvio(cadastroExistente.CriadoEm);
            var codigoExistente = CriarCodigoCadastroPendente(cadastroExistente);
            _cadastroPendenteRepository.Update(cadastroExistente);
            await _repository.SaveChangesAsync();
            return (
                ResultadoCriacaoUsuario.Sucesso,
                await MontarRespostaCadastroPendenteAsync(
                    cadastroExistente,
                    codigoExistente,
                    TipoCodigoEmail.ConfirmacaoEmail));
        }

        var agora = DateTime.UtcNow;
        var tentativaId = Guid.NewGuid();
        var cadastro = new CadastroPendente
        {
            Id = tentativaId,
            Name = dto.Name.Trim(),
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            TipoDiabetes = dto.TipoDiabetes,
            Idade = dto.Idade,
            Celular = dto.Celular,
            FatorSensibilidade = dto.FatorSensibilidade,
            HgtAlvo = dto.HgtAlvo,
            AceitouTermos = dto.AceitouTermos,
            ConsentiuDadosSaude = dto.ConsentiuDadosSaude,
            DataConsentimento = agora,
            ResponsavelNome = dto.ResponsavelNome?.Trim(),
            ConsentimentoResponsavel = dto.ConsentimentoResponsavel,
            CriadoEm = agora
        };
        var codigoTexto = CriarCodigoCadastroPendente(cadastro);
        await _cadastroPendenteRepository.AddAsync(cadastro);

        try
        {
            await _repository.SaveChangesAsync();
        }
        catch (EmailJaExisteException)
        {
            return (ResultadoCriacaoUsuario.EmailJaExiste, null);
        }

        return (
            ResultadoCriacaoUsuario.Sucesso,
            await MontarRespostaCadastroPendenteAsync(
                cadastro,
                codigoTexto,
                TipoCodigoEmail.ConfirmacaoEmail));
    }

    public async Task<LoginResultDto> LoginAsync(LoginDto dto)
    {
        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (usuario == null || !usuario.Ativo
            || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.Senha))
        {
            return new LoginResultDto();
        }

        if (!usuario.EmailConfirmado)
        {
            return new LoginResultDto { EmailNaoConfirmado = true };
        }

        return new LoginResultDto
        {
            Resposta = new LoginResponseDto
            {
                Token = _tokenService.GenerateToken(usuario),
                Usuario = MapearParaOutput(usuario)
            }
        };
    }

    public async Task<ConsultarCadastroResponseDto> ConsultarCadastroAsync(
        ConsultarCadastroDto dto)
    {
        var usuario = await _repository.GetByEmailOuEmailPendenteAsync(NormalizarEmail(dto.Email));
        return new ConsultarCadastroResponseDto
        {
            Status = usuario == null ? "novo" : usuario.Ativo ? "ativo" : "desativado"
        };
    }

    public async Task ConfirmarEmailAsync(ConfirmarEmailDto dto)
    {
        var cadastro = await _cadastroPendenteRepository.GetByIdAsync(dto.TentativaId);
        if (cadastro != null)
        {
            if (!string.Equals(
                    cadastro.Email,
                    NormalizarEmail(dto.Email),
                    StringComparison.OrdinalIgnoreCase))
            {
                throw CodigoInvalido();
            }

            await ValidarCodigoCadastroPendenteAsync(cadastro, dto.Codigo);
            var usuarioCriado = new Usuario
            {
                Name = cadastro.Name,
                Email = cadastro.Email,
                Senha = cadastro.SenhaHash,
                TipoDiabetes = cadastro.TipoDiabetes,
                Idade = cadastro.Idade,
                Celular = cadastro.Celular,
                FatorSensibilidade = cadastro.FatorSensibilidade,
                HgtAlvo = cadastro.HgtAlvo,
                Role = "Usuario",
                EmailConfirmado = true,
                AceitouTermos = cadastro.AceitouTermos,
                ConsentiuDadosSaude = cadastro.ConsentiuDadosSaude,
                DataConsentimento = cadastro.DataConsentimento,
                ResponsavelNome = cadastro.ResponsavelNome,
                ConsentimentoResponsavel = cadastro.ConsentimentoResponsavel
            };
            await _repository.AddAsync(usuarioCriado);
            _cadastroPendenteRepository.Remove(cadastro);
            try
            {
                await _repository.SaveChangesAsync();
            }
            catch (EmailJaExisteException)
            {
                throw new CodigoVerificacaoException("Este e-mail já está cadastrado.");
            }
            return;
        }

        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (usuario == null)
        {
            throw CodigoInvalido();
        }

        var codigo = await _codigoRepository.GetByTentativaAsync(
            usuario.Id,
            TipoCodigoVerificacao.ConfirmacaoEmail,
            dto.TentativaId);

        await ValidarCodigoAsync(codigo, dto.Codigo);
        usuario.EmailConfirmado = true;
        codigo!.UsadoEm = DateTime.UtcNow;
        _repository.Update(usuario);
        await _repository.SaveChangesAsync();
    }

    public async Task ReenviarCodigoAsync(ReenviarCodigoDto dto)
    {
        var cadastro = await _cadastroPendenteRepository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (cadastro != null)
        {
            GarantirIntervaloReenvio(cadastro.CriadoEm);
            var codigoCadastro = CriarCodigoCadastroPendente(cadastro);
            _cadastroPendenteRepository.Update(cadastro);
            await _repository.SaveChangesAsync();
            await _emailService.EnviarCodigoAsync(
                cadastro.Email,
                cadastro.Name,
                codigoCadastro,
                TipoCodigoEmail.ConfirmacaoEmail);
            return;
        }

        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (usuario == null || !usuario.Ativo || usuario.EmailConfirmado)
        {
            return;
        }

        await GarantirIntervaloReenvioAsync(usuario.Id, TipoCodigoVerificacao.ConfirmacaoEmail);
        var anterior = await _codigoRepository.GetMaisRecenteAsync(
            usuario.Id,
            TipoCodigoVerificacao.ConfirmacaoEmail);
        var tentativaId = anterior?.TentativaId ?? Guid.NewGuid();
        var (_, codigoTexto) = await CriarCodigoAsync(
            usuario,
            TipoCodigoVerificacao.ConfirmacaoEmail,
            tentativaId);
        await _repository.SaveChangesAsync();
        await _emailService.EnviarCodigoAsync(
            usuario.Email,
            usuario.Name,
            codigoTexto,
            TipoCodigoEmail.ConfirmacaoEmail);
    }

    public async Task ConfirmarNovoEmailAsync(int usuarioId, ConfirmarNovoEmailDto dto)
    {
        var usuario = await _repository.GetByIdAsync(usuarioId);
        var codigos = await _codigoRepository.GetAtivosAsync(
            usuarioId,
            TipoCodigoVerificacao.NovoEmail);
        var codigo = codigos.FirstOrDefault();

        if (usuario == null || codigo == null
            || !ValidarHash(dto.Codigo, codigo.CodigoHash))
        {
            await RegistrarTentativaInvalidaAsync(codigo);
            throw CodigoInvalido();
        }

        await ValidarCodigoAsync(codigo, dto.Codigo);
        if (string.IsNullOrWhiteSpace(usuario.EmailPendente)
            || !string.Equals(usuario.EmailPendente, codigo.NovoEmail, StringComparison.OrdinalIgnoreCase))
        {
            throw CodigoInvalido();
        }

        usuario.Email = usuario.EmailPendente;
        usuario.EmailPendente = null;
        codigo.UsadoEm = DateTime.UtcNow;
        _repository.Update(usuario);
        try
        {
            await _repository.SaveChangesAsync();
        }
        catch (EmailJaExisteException)
        {
            throw new CodigoVerificacaoException("Este e-mail já está em uso.");
        }
    }

    public async Task SolicitarRecuperacaoSenhaAsync(RecuperarSenhaDto dto)
    {
        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (usuario == null || !usuario.Ativo)
        {
            return;
        }

        var maisRecente = await _codigoRepository.GetMaisRecenteAsync(
            usuario.Id,
            TipoCodigoVerificacao.RecuperacaoSenha);
        if (maisRecente != null
            && DateTime.UtcNow - maisRecente.CriadoEm
                < TimeSpan.FromSeconds(_codigoOpcoes.IntervaloReenvioSegundos))
        {
            return;
        }

        var (_, codigoTexto) = await CriarCodigoAsync(
            usuario,
            TipoCodigoVerificacao.RecuperacaoSenha,
            Guid.NewGuid());
        await _repository.SaveChangesAsync();
        await _emailService.EnviarCodigoAsync(
            usuario.Email,
            usuario.Name,
            codigoTexto,
            TipoCodigoEmail.RecuperacaoSenha);
    }

    public async Task RedefinirSenhaAsync(RedefinirSenhaDto dto)
    {
        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        var codigos = usuario == null
            ? []
            : await _codigoRepository.GetAtivosAsync(
                usuario.Id,
                TipoCodigoVerificacao.RecuperacaoSenha);
        var codigo = codigos.FirstOrDefault();

        if (usuario == null || codigo == null
            || !ValidarHash(dto.Codigo, codigo.CodigoHash))
        {
            await RegistrarTentativaInvalidaAsync(codigo);
            throw CodigoInvalido();
        }

        await ValidarCodigoAsync(codigo, dto.Codigo);
        usuario!.Senha = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        codigo.UsadoEm = DateTime.UtcNow;
        _repository.Update(usuario);
        await _repository.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var usuario = await _repository.GetByIdAsync(id);
        if (usuario == null)
        {
            return false;
        }

        usuario.Ativo = false;
        _repository.Update(usuario);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReativarContaAsync(ReativarContaDto dto)
    {
        var usuario = await _repository.GetByEmailAsync(NormalizarEmail(dto.Email));
        if (usuario == null || usuario.Ativo
            || !BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.Senha))
        {
            return false;
        }

        usuario.Ativo = true;
        _repository.Update(usuario);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<List<UsuarioOutputDto>> GetAllAsync()
    {
        var usuarios = await _repository.GetAllAsync();
        return usuarios.Select(MapearParaOutput).ToList();
    }

    public async Task<UsuarioOutputDto?> GetByIdAsync(int id)
    {
        var usuario = await _repository.GetByIdAsync(id);
        return usuario == null ? null : MapearParaOutput(usuario);
    }

    public async Task<ResultadoPatchUsuario> PatchAsync(int id, UsuarioPatchDto dto)
    {
        var usuario = await _repository.GetByIdAsync(id);
        if (usuario == null)
        {
            return ResultadoPatchUsuario.UsuarioNaoEncontrado;
        }

        if (dto.Name != null) usuario.Name = dto.Name;
        if (dto.TipoDiabetes != null) usuario.TipoDiabetes = dto.TipoDiabetes;
        if (dto.Idade != null) usuario.Idade = dto.Idade;
        if (dto.Celular != null) usuario.Celular = dto.Celular;
        if (dto.FatorSensibilidade != null) usuario.FatorSensibilidade = dto.FatorSensibilidade.Value;
        if (dto.HgtAlvo != null) usuario.HgtAlvo = dto.HgtAlvo.Value;

        string? emailParaEnviar = null;
        string? codigoParaEnviar = null;

        if (dto.Email != null)
        {
            var email = NormalizarEmail(dto.Email);
            if (string.Equals(email, usuario.Email, StringComparison.OrdinalIgnoreCase))
            {
                usuario.EmailPendente = null;
                await InvalidarCodigosAsync(usuario.Id, TipoCodigoVerificacao.NovoEmail);
            }
            else
            {
                if (await _repository.EmailUsadoPorOutroAsync(email, usuario.Id))
                {
                    return ResultadoPatchUsuario.EmailJaExiste;
                }

                if (string.Equals(email, usuario.EmailPendente, StringComparison.OrdinalIgnoreCase))
                {
                    await GarantirIntervaloReenvioAsync(usuario.Id, TipoCodigoVerificacao.NovoEmail);
                }

                usuario.EmailPendente = email;
                var (_, codigo) = await CriarCodigoAsync(
                    usuario,
                    TipoCodigoVerificacao.NovoEmail,
                    Guid.NewGuid(),
                    email);
                emailParaEnviar = email;
                codigoParaEnviar = codigo;
            }
        }

        _repository.Update(usuario);
        try
        {
            await _repository.SaveChangesAsync();
        }
        catch (EmailJaExisteException)
        {
            return ResultadoPatchUsuario.EmailJaExiste;
        }

        if (emailParaEnviar != null && codigoParaEnviar != null)
        {
            await _emailService.EnviarCodigoAsync(
                emailParaEnviar,
                usuario.Name,
                codigoParaEnviar,
                TipoCodigoEmail.NovoEmail);
        }

        return ResultadoPatchUsuario.Sucesso;
    }

    public async Task<bool> UsuarioAtivoAsync(int id)
    {
        var usuario = await _repository.GetByIdAsync(id);
        return usuario?.Ativo == true;
    }

    private string CriarCodigoCadastroPendente(CadastroPendente cadastro)
    {
        var texto = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var agora = DateTime.UtcNow;
        cadastro.CodigoHash = CriarHash(texto);
        cadastro.ExpiraEm = agora.Add(ValidadeCodigo);
        cadastro.Tentativas = 0;
        cadastro.CriadoEm = agora;
        return texto;
    }

    private async Task<CadastroPendenteDto> MontarRespostaCadastroPendenteAsync(
        CadastroPendente cadastro,
        string codigo,
        TipoCodigoEmail tipo)
    {
        await _emailService.EnviarCodigoAsync(
            cadastro.Email,
            cadastro.Name,
            codigo,
            tipo);
        return new CadastroPendenteDto
        {
            TentativaId = cadastro.Id,
            Email = cadastro.Email,
            EmailEnviado = true
        };
    }

    private async Task ValidarCodigoCadastroPendenteAsync(
        CadastroPendente cadastro,
        string texto)
    {
        if (cadastro.ExpiraEm <= DateTime.UtcNow)
        {
            throw CodigoInvalido();
        }

        if (cadastro.Tentativas >= MaxTentativasCodigo)
        {
            throw new CodigoVerificacaoException(
                "Limite de tentativas excedido. Solicite um novo código.");
        }

        if (!ValidarHash(texto, cadastro.CodigoHash))
        {
            cadastro.Tentativas++;
            _cadastroPendenteRepository.Update(cadastro);
            await _repository.SaveChangesAsync();
            throw CodigoInvalido();
        }
    }

    private void GarantirIntervaloReenvio(DateTime criadoEm)
    {
        if (DateTime.UtcNow - criadoEm
            < TimeSpan.FromSeconds(_codigoOpcoes.IntervaloReenvioSegundos))
        {
            throw new IntervaloReenvioException(
                $"Aguarde {_codigoOpcoes.IntervaloReenvioSegundos} segundos antes de pedir outro código.");
        }
    }

    private async Task<(CodigoVerificacao Codigo, string Texto)> CriarCodigoAsync(
        Usuario usuario,
        TipoCodigoVerificacao tipo,
        Guid tentativaId,
        string? novoEmail = null)
    {
        await InvalidarCodigosAsync(usuario.Id, tipo);
        var texto = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var agora = DateTime.UtcNow;
        var codigo = new CodigoVerificacao
        {
            UsuarioId = usuario.Id,
            Usuario = usuario,
            Tipo = tipo,
            CodigoHash = CriarHash(texto),
            TentativaId = tentativaId,
            NovoEmail = novoEmail,
            ExpiraEm = agora.Add(ValidadeCodigo),
            Tentativas = 0,
            CriadoEm = agora
        };
        await _codigoRepository.AddAsync(codigo);
        return (codigo, texto);
    }

    private async Task InvalidarCodigosAsync(int usuarioId, TipoCodigoVerificacao tipo)
    {
        var ativos = await _codigoRepository.GetAtivosAsync(usuarioId, tipo);
        var agora = DateTime.UtcNow;
        foreach (var codigo in ativos)
        {
            codigo.UsadoEm = agora;
        }
    }

    private async Task GarantirIntervaloReenvioAsync(int usuarioId, TipoCodigoVerificacao tipo)
    {
        var maisRecente = await _codigoRepository.GetMaisRecenteAsync(usuarioId, tipo);
        if (maisRecente != null
            && DateTime.UtcNow - maisRecente.CriadoEm
                < TimeSpan.FromSeconds(_codigoOpcoes.IntervaloReenvioSegundos))
        {
            throw new IntervaloReenvioException(
                $"Aguarde {_codigoOpcoes.IntervaloReenvioSegundos} segundos antes de pedir outro código.");
        }

    }

    private async Task ValidarCodigoAsync(CodigoVerificacao? codigo, string texto)
    {
        if (codigo == null || codigo.UsadoEm != null || codigo.ExpiraEm <= DateTime.UtcNow)
        {
            throw CodigoInvalido();
        }

        if (codigo.Tentativas >= MaxTentativasCodigo)
        {
            throw new CodigoVerificacaoException("Limite de tentativas excedido. Solicite um novo código.");
        }

        if (!ValidarHash(texto, codigo.CodigoHash))
        {
            codigo.Tentativas++;
            await _codigoRepository.SaveChangesAsync();
            throw CodigoInvalido();
        }
    }

    private async Task RegistrarTentativaInvalidaAsync(CodigoVerificacao? codigo)
    {
        if (codigo == null || codigo.UsadoEm != null || codigo.ExpiraEm <= DateTime.UtcNow)
        {
            return;
        }

        if (codigo.Tentativas < MaxTentativasCodigo)
        {
            codigo.Tentativas++;
            await _codigoRepository.SaveChangesAsync();
        }
    }

    private string CriarHash(string codigo)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var payload = Encoding.UTF8.GetBytes($"{Convert.ToHexString(salt)}:{codigo}");
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(_codigoOpcoes.ChaveHash), payload);
        return $"{Convert.ToHexString(salt)}:{Convert.ToHexString(hash)}";
    }

    private bool ValidarHash(string codigo, string codigoHash)
    {
        var partes = codigoHash.Split(':', 2);
        if (partes.Length != 2)
        {
            return false;
        }

        byte[] salt;
        byte[] hashEsperado;
        try
        {
            salt = Convert.FromHexString(partes[0]);
            hashEsperado = Convert.FromHexString(partes[1]);
        }
        catch (FormatException)
        {
            return false;
        }

        var payload = Encoding.UTF8.GetBytes($"{partes[0]}:{codigo}");
        var hashInformado = HMACSHA256.HashData(Encoding.UTF8.GetBytes(_codigoOpcoes.ChaveHash), payload);
        return salt.Length == 16
            && CryptographicOperations.FixedTimeEquals(hashEsperado, hashInformado);
    }

    private static string NormalizarEmail(string email) => email.Trim().ToLowerInvariant();

    private static CodigoVerificacaoException CodigoInvalido() =>
        new("Código inválido ou expirado. Confira o código ou solicite outro.");

    private static UsuarioOutputDto MapearParaOutput(Usuario usuario) =>
        new()
        {
            Id = usuario.Id,
            Name = usuario.Name,
            Email = usuario.Email,
            TipoDiabetes = usuario.TipoDiabetes,
            Idade = usuario.Idade,
            Celular = usuario.Celular,
            FatorSensibilidade = usuario.FatorSensibilidade,
            HgtAlvo = usuario.HgtAlvo
        };
}
