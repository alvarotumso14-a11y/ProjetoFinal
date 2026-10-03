using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services
{
    public class RegistroGlicemiaService : IRegistroGlicemiaService
    {
        private readonly IRegistroGlicemiaRepository _repository;

        public RegistroGlicemiaService(IRegistroGlicemiaRepository repository)
        {
            _repository = repository;
        }

        public async Task<RegistroGlicemiaOutputDto> CreateAsync(RegistroGlicemiaCreateDto dto, int usuarioId)
        {
            var registro = new RegistroGlicemia
            {
                Glicemia = dto.Glicemia,
                GlicemiaAcimaDoLimite = dto.GlicemiaAcimaDoLimite,
                Dose = dto.Dose,
                Hora = dto.Hora,
                Refeicao = dto.Refeicao,
                Data = dto.Data,
                Observacao = dto.Observacao,
                UsuarioId = usuarioId
            };

            await _repository.AddAsync(registro);
            await _repository.SaveChangesAsync();

            return MapearParaOutput(registro);
        }

        public async Task<bool> DeleteAsync(int id, int usuarioId)
        {
            var registro = await _repository.GetByIdAsync(id, usuarioId);

            if (registro == null)
            {
                return false;
            }

            _repository.Delete(registro);

            await _repository.SaveChangesAsync();

            return true;
        }

        public async Task<List<RegistroGlicemiaOutputDto>> GetAllAsync(int usuarioId)
        {
            var registros =
                await _repository.GetAllUsuarioIdAsync(usuarioId);

            return registros
                .Select(registro => MapearParaOutput(registro))
                .ToList();
        }

        public async Task<RegistroGlicemiaOutputDto?> GetByIdAsync(int id, int usuarioId)
        {
            var registro =
                await _repository.GetByIdAsync(id, usuarioId);

            if (registro == null)
            {
                return null;
            }

            return MapearParaOutput(registro);
        }

        public async Task<bool> UpdateAsync(int id, RegistroGlicemiaUpdateDto dto, int usuarioId)
        {
            var registroExiste =
                await _repository.GetByIdAsync(id, usuarioId);

            if (registroExiste == null)
            {
                return false;
            }

            registroExiste.Glicemia = dto.Glicemia;
            registroExiste.GlicemiaAcimaDoLimite = dto.GlicemiaAcimaDoLimite;
            registroExiste.Dose = dto.Dose;
            registroExiste.Hora = dto.Hora;
            registroExiste.Refeicao = dto.Refeicao;
            registroExiste.Data = dto.Data;
            registroExiste.Observacao = dto.Observacao;

            _repository.Update(registroExiste);

            await _repository.SaveChangesAsync();

            return true;
        }

        public async Task<List<RegistroGlicemiaOutputDto>> GetByPeriodoAsync(int usuarioId, DateOnly dataInicial, DateOnly dataFinal)
        {
            var registros = await _repository.GetByPeriodoAsync(
                usuarioId,
                dataInicial,
                dataFinal);

            return registros
                .Select(registro => MapearParaOutput(registro))
                .ToList();
        }

        private RegistroGlicemiaOutputDto MapearParaOutput(RegistroGlicemia registro)
        {
            return new RegistroGlicemiaOutputDto
            {
                Id = registro.Id,
                Glicemia = registro.Glicemia,
                GlicemiaAcimaDoLimite = registro.GlicemiaAcimaDoLimite,
                Dose = registro.Dose,
                Hora = registro.Hora,
                Refeicao = registro.Refeicao,
                Data = registro.Data,
                Observacao = registro.Observacao,
                UsuarioId = registro.UsuarioId
            };
        }
    }
}