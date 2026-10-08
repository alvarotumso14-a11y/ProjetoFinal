using Application.Interfaces;
using Application.Services;
using Domain.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Presentation;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Configuração Jwt:Key ausente ou inválida. Configure uma chave secreta com pelo menos 32 bytes usando User Secrets ou variável de ambiente.");
}

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    )
);

builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<ICodigoVerificacaoRepository, CodigoVerificacaoRepository>();
builder.Services.AddScoped<ICadastroPendenteRepository, CadastroPendenteRepository>();
var smtpSection = builder.Configuration.GetSection(SmtpOptions.SectionName);
var smtpOptions = smtpSection.Get<SmtpOptions>() ?? new SmtpOptions();
builder.Services.Configure<SmtpOptions>(smtpSection);
EmailStartup.ValidarConfiguracao(builder.Environment.IsDevelopment(), smtpOptions);
if (string.IsNullOrWhiteSpace(smtpOptions.Password))
{
    builder.Services.AddScoped<IEmailService, LogEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
}
builder.Services.AddSingleton(new CodigoVerificacaoOpcoes
{
    ChaveHash = jwtKey,
    IntervaloReenvioSegundos =
        builder.Configuration.GetValue("Codigo:IntervaloReenvioSegundos", 60)
});

builder.Services.AddScoped<
    IRegistroGlicemiaRepository,
    RegistroGlicemiaRepository>();

builder.Services.AddScoped<IUsuarioService, UsuarioService>();

builder.Services.AddScoped<
    IRegistroGlicemiaService,
    RegistroGlicemiaService>();

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<
    IHistoricoPdfService,
    HistoricoPdfService>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Digite o token JWT."
        });

    options.AddSecurityRequirement(
        new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference =
                        new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// Autenticação JWT
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    )
            };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var usuarioIdClaim =
                    context.Principal?
                        .FindFirst(
                            ClaimTypes.NameIdentifier
                        );

                if (usuarioIdClaim == null)
                {
                    context.Fail(
                        "Usuário inválido."
                    );

                    return;
                }

                if (!int.TryParse(
                        usuarioIdClaim.Value,
                        out var usuarioId))
                {
                    context.Fail(
                        "Usuário inválido."
                    );

                    return;
                }

                var usuarioService =
                    context.HttpContext
                        .RequestServices
                        .GetRequiredService<
                            IUsuarioService>();

                var usuarioAtivo =
                    await usuarioService
                        .UsuarioAtivoAsync(
                            usuarioId
                        );

                if (!usuarioAtivo)
                {
                    context.Fail(
                        "Usuário inativo."
                    );
                }
            }
        };
    });


builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddPolicy(
        "fixed",
        httpContext =>
        {
            var chave =
                httpContext.User.Identity?
                    .IsAuthenticated == true
                    ? httpContext.User
                        .FindFirst(
                            ClaimTypes.NameIdentifier
                        )?.Value
                    : httpContext.Connection
                        .RemoteIpAddress?
                        .ToString();

            return RateLimitPartition
                .GetFixedWindowLimiter(
                    partitionKey:
                        chave ?? "desconhecido",

                    factory: _ =>
                        new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 60,

                            Window =
                                TimeSpan.FromMinutes(1),

                            QueueLimit = 0,

                            AutoReplenishment = true
                        });
        });

    options.AddPolicy(
        "login",
        httpContext =>
        {
            var ip =
                httpContext.Connection
                    .RemoteIpAddress?
                    .ToString()
                ?? "desconhecido";

            return RateLimitPartition
                .GetFixedWindowLimiter(
                    partitionKey: ip,

                    factory: _ =>
                        new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,

                            Window =
                                TimeSpan.FromMinutes(1),

                            QueueLimit = 0,

                            AutoReplenishment = true
                        });
        });

    options.AddPolicy(
        "verification",
        httpContext =>
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido";
            var caminho = httpContext.Request.Path.Value ?? string.Empty;

            return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: $"{ip}:{caminho}",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
        });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseRouting();

app.UseAuthentication();

app.UseRateLimiter();

app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }