using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaFatorSensibilidadeEHgtAlvo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistroGlicemia_Usuarios_UsuarioId",
                table: "RegistroGlicemia");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RegistroGlicemia",
                table: "RegistroGlicemia");

            migrationBuilder.RenameTable(
                name: "RegistroGlicemia",
                newName: "RegistrosGlicemia");

            migrationBuilder.RenameIndex(
                name: "IX_RegistroGlicemia_UsuarioId",
                table: "RegistrosGlicemia",
                newName: "IX_RegistrosGlicemia_UsuarioId");

            migrationBuilder.AddColumn<int>(
                name: "FatorSensibilidade",
                table: "Usuarios",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "HgtAlvo",
                table: "Usuarios",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RegistrosGlicemia",
                table: "RegistrosGlicemia",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosGlicemia_Usuarios_UsuarioId",
                table: "RegistrosGlicemia");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RegistrosGlicemia",
                table: "RegistrosGlicemia");

            migrationBuilder.DropColumn(
                name: "FatorSensibilidade",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "HgtAlvo",
                table: "Usuarios");

            migrationBuilder.RenameTable(
                name: "RegistrosGlicemia",
                newName: "RegistroGlicemia");

            migrationBuilder.RenameIndex(
                name: "IX_RegistrosGlicemia_UsuarioId",
                table: "RegistroGlicemia",
                newName: "IX_RegistroGlicemia_UsuarioId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RegistroGlicemia",
                table: "RegistroGlicemia",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistroGlicemia_Usuarios_UsuarioId",
                table: "RegistroGlicemia",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }
    }
}
