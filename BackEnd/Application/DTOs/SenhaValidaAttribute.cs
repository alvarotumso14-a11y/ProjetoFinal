using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class SenhaValidaAttribute : ValidationAttribute
{
    public SenhaValidaAttribute()
    {
        ErrorMessage = "A senha deve ter entre 8 e 64 caracteres e até 72 bytes UTF-8.";
    }

    public override bool IsValid(object? value)
    {
        if (value is not string senha)
        {
            return false;
        }

        return senha.Length is >= 8 and <= 64
            && Encoding.UTF8.GetByteCount(senha) <= 72;
    }
}
