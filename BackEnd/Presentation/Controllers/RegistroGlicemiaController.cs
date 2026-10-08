using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/registro-glicemia")]
    [Authorize]
    [EnableRateLimiting("fixed")]
    public class RegistroGlicemiaController : ControllerBase
    {
        private readonly IRegistroGlicemiaService _service;
        private readonly IHistoricoPdfService _pdfService;
        private readonly IUsuarioService _usuarioService;


        public RegistroGlicemiaController(IRegistroGlicemiaService service, IHistoricoPdfService pdfService, IUsuarioService usuarioService)
        {
            _service = service;
            _pdfService = pdfService;
            _usuarioService = usuarioService;
        }


        [HttpPost]
        public async Task<IActionResult> Create(RegistroGlicemiaCreateDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var registroCriado = await _service.CreateAsync(dto, usuarioId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = registroCriado.Id },
                registroCriado
            );
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var registro = await _service.GetByIdAsync(id, usuarioId);

            if (registro == null)
            {
                return NotFound();
            }

            return Ok(registro);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var registros = await _service.GetAllAsync(usuarioId);

            return Ok(registros);
        }

        [HttpGet("pdf")]
        public async Task<IActionResult> BaixarHistoricoPdf(DateOnly dataInicial, DateOnly dataFinal)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            if (dataFinal < dataInicial)
            {
                return BadRequest(
                    "A data final não pode ser menor que a data inicial.");
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var usuario = await _usuarioService.GetByIdAsync(usuarioId);

            if (usuario == null)
            {
                return NotFound();
            }

            var registros = await _service.GetByPeriodoAsync(
                usuarioId,
                dataInicial,
                dataFinal);

            var pdf = _pdfService.GerarHistoricoPdf(
                usuario,
                registros);

            return File(
                pdf,
                "application/pdf",
                $"GlicHelp-{dataInicial:dd-MM-yyyy}-a-{dataFinal:dd-MM-yyyy}.pdf"
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, RegistroGlicemiaUpdateDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var atualizado = await _service.UpdateAsync(id, dto, usuarioId);

            if (!atualizado)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (usuarioIdClaim == null)
            {
                return Unauthorized();
            }

            var usuarioId = int.Parse(usuarioIdClaim.Value);

            var deletado = await _service.DeleteAsync(id, usuarioId);

            if (!deletado)
            {
                return NotFound();
            }

            return NoContent();
        }

    }
}
