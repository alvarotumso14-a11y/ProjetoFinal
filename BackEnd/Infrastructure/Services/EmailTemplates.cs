using Application.Interfaces;
using System.Net;

namespace Infrastructure.Services;

public static class EmailTemplates
{
    public static (string Assunto, string Texto, string Html) Criar(
        string nome,
        string codigo,
        TipoCodigoEmail tipo)
    {
        var finalidade = tipo switch
        {
            TipoCodigoEmail.ConfirmacaoEmail => "confirmar seu cadastro",
            TipoCodigoEmail.NovoEmail => "confirmar seu novo e-mail",
            TipoCodigoEmail.RecuperacaoSenha => "recuperar sua senha",
            _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Tipo de código desconhecido.")
        };
        var nomeSeguro = WebUtility.HtmlEncode(
            string.IsNullOrWhiteSpace(nome) ? "pessoa usuária" : nome.Trim());
        var assunto = tipo switch
        {
            TipoCodigoEmail.ConfirmacaoEmail => "Confirme seu cadastro no GlicHelp",
            TipoCodigoEmail.NovoEmail => "Confirme seu novo e-mail no GlicHelp",
            TipoCodigoEmail.RecuperacaoSenha => "Recupere sua senha do GlicHelp",
            _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Tipo de código desconhecido.")
        };

        var texto = $"G l i c H e l p\n\n"
            + $"Olá, {WebUtility.HtmlDecode(nomeSeguro)}!\n\n"
            + $"Use o código {codigo} para {finalidade}. Ele expira em 15 minutos.\n\n"
            + "Se você não pediu este código, pode ignorar este e-mail.";
        var html = $"""
            <!doctype html>
            <html lang="pt-BR">
            <body style="font-family:Arial,sans-serif;color:#18312f;line-height:1.5">
              <main style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #dce7e5;border-radius:12px">
                <h1 style="color:#d32f2f;letter-spacing:4px">GlicHelp</h1>
                <p>Olá, {nomeSeguro}!</p>
                <p>Use este código para {finalidade}:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:8px">{codigo}</p>
                <p>O código expira em 15 minutos.</p>
                <p>Se você não pediu este código, pode ignorar este e-mail.</p>
              </main>
            </body>
            </html>
            """;

        return (assunto, texto, html);
    }
}
