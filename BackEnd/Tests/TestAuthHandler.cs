using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Tests
{
    public class TestAuthHandler
        : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "Test";

        public TestAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var usuarioId =
                Request.Headers["X-Test-UserId"].FirstOrDefault()
                ?? "1";

            var claims = new[]
            {
        new Claim(
            ClaimTypes.NameIdentifier,
            usuarioId
        ),

        new Claim(
            ClaimTypes.Email,
            $"usuario{usuarioId}@teste.com"
        )
    };

            var identity = new ClaimsIdentity(
                claims,
                SchemeName
            );

            var principal =
                new ClaimsPrincipal(identity);

            var ticket =
                new AuthenticationTicket(
                    principal,
                    SchemeName
                );

            return Task.FromResult(
                AuthenticateResult.Success(ticket)
            );
        }
    }
}