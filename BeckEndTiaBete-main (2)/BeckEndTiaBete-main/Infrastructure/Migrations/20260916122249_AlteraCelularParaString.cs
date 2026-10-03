using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlteraCelularParaString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "RegistrosGlicemia",
                newName: "Data");

            migrationBuilder.AlterColumn<string>(
                name: "Celular",
                table: "Usuarios",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "UsuarioId",
                table: "RegistrosGlicemia",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Dose",
                table: "RegistrosGlicemia",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia");

            migrationBuilder.RenameColumn(
                name: "Data",
                table: "RegistrosGlicemia",
                newName: "Date");

            migrationBuilder.AlterColumn<int>(
                name: "Celular",
                table: "Usuarios",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "UsuarioId",
                table: "RegistrosGlicemia",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<decimal>(
                name: "Dose",
                table: "RegistrosGlicemia",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }
    }
}
