using Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261008153000_AdicionaCadastrosPendentes")]
    public partial class AdicionaCadastrosPendentes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CadastrosPendentes",
                columns: table => new
                {
                    Id = table.Column<Guid>(
                        type: "char(36)",
                        nullable: false,
                        collation: "ascii_general_ci"),
                    Name = table.Column<string>(
                        type: "longtext",
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(
                        type: "varchar(255)",
                        maxLength: 255,
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SenhaHash = table.Column<string>(
                        type: "varchar(255)",
                        maxLength: 255,
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TipoDiabetes = table.Column<string>(
                        type: "longtext",
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Idade = table.Column<int>(
                        type: "int",
                        nullable: true),
                    Celular = table.Column<string>(
                        type: "longtext",
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FatorSensibilidade = table.Column<int>(
                        type: "int",
                        nullable: false),
                    HgtAlvo = table.Column<int>(
                        type: "int",
                        nullable: false),
                    AceitouTermos = table.Column<bool>(
                        type: "tinyint(1)",
                        nullable: false),
                    ConsentiuDadosSaude = table.Column<bool>(
                        type: "tinyint(1)",
                        nullable: false),
                    DataConsentimento = table.Column<DateTime>(
                        type: "datetime(6)",
                        nullable: false),
                    ResponsavelNome = table.Column<string>(
                        type: "varchar(150)",
                        maxLength: 150,
                        nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConsentimentoResponsavel = table.Column<bool>(
                        type: "tinyint(1)",
                        nullable: false),
                    CodigoHash = table.Column<string>(
                        type: "varchar(128)",
                        maxLength: 128,
                        nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiraEm = table.Column<DateTime>(
                        type: "datetime(6)",
                        nullable: false),
                    Tentativas = table.Column<int>(
                        type: "int",
                        nullable: false),
                    CriadoEm = table.Column<DateTime>(
                        type: "datetime(6)",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CadastrosPendentes", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_CadastrosPendentes_Email",
                table: "CadastrosPendentes",
                column: "Email",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CadastrosPendentes");
        }
    }
}
