using Application.DTOs;

namespace Application.Interfaces
{
    public interface IHistoricoPdfService
    {
        byte[] GerarHistoricoPdf(UsuarioOutputDto usuario,
            List<RegistroGlicemiaOutputDto> registros);
    }
}