namespace Domain.Entities;

public class CadastroPendente
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string TipoDiabetes { get; set; } = string.Empty;
    public int? Idade { get; set; }
    public string? Celular { get; set; }
    public int FatorSensibilidade { get; set; }
    public int HgtAlvo { get; set; }
    public bool AceitouTermos { get; set; }
    public bool ConsentiuDadosSaude { get; set; }
    public DateTime DataConsentimento { get; set; }
    public string? ResponsavelNome { get; set; }
    public bool ConsentimentoResponsavel { get; set; }
    public string CodigoHash { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; }
    public int Tentativas { get; set; }
    public DateTime CriadoEm { get; set; }
}
