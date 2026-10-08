namespace Domain.Entities;

public enum TipoCodigoVerificacao
{
    ConfirmacaoEmail,
    NovoEmail,
    RecuperacaoSenha
}

public class CodigoVerificacao
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public TipoCodigoVerificacao Tipo { get; set; }
    public string CodigoHash { get; set; } = string.Empty;
    public Guid TentativaId { get; set; }
    public string? NovoEmail { get; set; }
    public DateTime ExpiraEm { get; set; }
    public int Tentativas { get; set; }
    public DateTime? UsadoEm { get; set; }
    public DateTime CriadoEm { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
