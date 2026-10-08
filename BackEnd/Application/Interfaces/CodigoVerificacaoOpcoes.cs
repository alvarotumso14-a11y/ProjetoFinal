namespace Application.Interfaces;

public class CodigoVerificacaoOpcoes
{
    public string ChaveHash { get; set; } = string.Empty;
    public int IntervaloReenvioSegundos { get; set; } = 60;
}
