using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaIndicadorMenorEDoseDecimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MenorDeIdade",
                table: "Usuarios",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                "UPDATE `Usuarios` SET `MenorDeIdade` = CASE WHEN `Idade` IS NOT NULL AND `Idade` < 18 THEN 1 ELSE 0 END;");

            migrationBuilder.AlterColumn<decimal>(
                name: "Dose",
                table: "RegistrosGlicemia",
                type: "decimal(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MenorDeIdade",
                table: "Usuarios");

            migrationBuilder.AlterColumn<int>(
                name: "Dose",
                table: "RegistrosGlicemia",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(5,1)",
                oldPrecision: 5,
                oldScale: 1);
        }
    }
}
