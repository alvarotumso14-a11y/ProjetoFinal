using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations;

public partial class SincronizaComFront : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "AceitouTermos",
            table: "Usuarios",
            type: "tinyint(1)",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "CodigoConfirmacaoExpiraEm",
            table: "Usuarios",
            type: "datetime(6)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CodigoConfirmacaoHash",
            table: "Usuarios",
            type: "longtext",
            nullable: true)
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.AddColumn<bool>(
            name: "ConsentimentoResponsavel",
            table: "Usuarios",
            type: "tinyint(1)",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "ConsentiuDadosSaude",
            table: "Usuarios",
            type: "tinyint(1)",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "DataConsentimento",
            table: "Usuarios",
            type: "datetime(6)",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "EmailConfirmado",
            table: "Usuarios",
            type: "tinyint(1)",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "ResponsavelNome",
            table: "Usuarios",
            type: "longtext",
            nullable: true)
            .Annotation("MySql:CharSet", "utf8mb4");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("AceitouTermos", "Usuarios");
        migrationBuilder.DropColumn("CodigoConfirmacaoExpiraEm", "Usuarios");
        migrationBuilder.DropColumn("CodigoConfirmacaoHash", "Usuarios");
        migrationBuilder.DropColumn("ConsentimentoResponsavel", "Usuarios");
        migrationBuilder.DropColumn("ConsentiuDadosSaude", "Usuarios");
        migrationBuilder.DropColumn("DataConsentimento", "Usuarios");
        migrationBuilder.DropColumn("EmailConfirmado", "Usuarios");
        migrationBuilder.DropColumn("ResponsavelNome", "Usuarios");
    }
}
