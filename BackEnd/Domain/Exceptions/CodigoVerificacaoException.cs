namespace Domain.Exceptions;

public class CodigoVerificacaoException : Exception
{
    public CodigoVerificacaoException(string message) : base(message)
    {
    }
}

public sealed class IntervaloReenvioException : Exception
{
    public IntervaloReenvioException(string message) : base(message)
    {
    }
}
