// Estado do histórico: registros vindos da API (mais recentes primeiro).
let registros = [];

async function carregarHistorico() {
    const lista = document.getElementById("historicoLista");
    try {
        const dados = await RegistroApi.listar(1, 500);
        registros = dados.map(registroDaApi);
    } catch (erro) {
        console.error("Não foi possível carregar o histórico.", erro);
        if (lista) {
            lista.innerHTML = `<div class="registro"><h3>${escaparHtml(erro.message)}</h3></div>`;
        }
        return;
    }
    atualizarHistorico();
}
let indiceRegistroEdicao = -1;
let salvandoEdicaoRegistro = false;

function formatarGlicemia(valor) {
    const numero = Number(valor);
    const textoValor = String(valor).toUpperCase();

    if (textoValor === "HI" || (Number.isFinite(numero) && numero > 600)) {
        return "HI";
    }

    if (textoValor === "LO" || (Number.isFinite(numero) && numero < 20)) {
        return "LO";
    }

    return `${valor} mg/dL`;
}

function dataParaComparacao(data) {
    const partes = String(data || "").split("/");
    return partes.length === 3 ? `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}` : data;
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// HISTÓRICO DE MEDIÇÕES
// atualiza a lista de registros exibida na página de histórico.
// Constrói os elementos HTML a partir do array `registros` carregado do localStorage.
function atualizarHistorico() {
    const lista = document.getElementById("historicoLista");

    if (!lista) {
        return;
    }

    if (registros.length === 0) {
        lista.innerHTML = `
            <div class="registro">
                <h3>Nenhum registro encontrado.</h3>
            </div>
        `;
        return;
    }

    lista.innerHTML = registros.map((registro, index) => `
            <div class="registro-item">
                <div class="registro-main">
                    <div class="registro-header">
                        <span class="metric-pill metric-glicemia">G</span>
                        <div>
                            <p class="registro-label">Glicemia</p>
                            <h3>${escaparHtml(formatarGlicemia(registro.glicemia))}</h3>
                        </div>
                    </div>

                    <div class="registro-meta">
                        <div>
                            <span class="meta-label">Dose</span>
                            <strong>${Number(registro.dose) || 0} U</strong>
                        </div>
                        <div>
                            <span class="meta-label">Hora</span>
                            <strong>${escaparHtml(registro.hora)}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Data</span>
                            <strong>${escaparHtml(registro.data)}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Refeição</span>
                            <strong>${escaparHtml(registro.refeicao)}</strong>
                        </div>
                    </div>
                    ${registro.observacao ? `
                        <div class="registro-observacao">
                            <span>Observação</span>
                            <span class="registro-observacao-texto" id="observacao-${index}">${escaparHtml(registro.observacao)}</span>
                            <button class="registro-observacao-mais" type="button" aria-expanded="false" aria-controls="observacao-${index}" hidden>Ler mais</button>
                        </div>
                    ` : ""}
                </div>

                <div class="botoesRegistro">
                    <button class="editar" onclick="editarRegistro(${index})">
                        Alterar
                    </button>
                </div>
            </div>
        `).join("");

    atualizarBotoesObservacao(lista);
}

function atualizarBotoesObservacao(lista) {
    lista.querySelectorAll(".registro-observacao-texto").forEach((texto) => {
        const botao = texto.parentElement.querySelector(".registro-observacao-mais");
        if (!botao || botao.getAttribute("aria-expanded") === "true") {
            return;
        }

        botao.hidden = texto.scrollHeight <= texto.clientHeight + 1;
    });
}

window.addEventListener("resize", () => {
    const lista = document.getElementById("historicoLista");
    if (lista) {
        atualizarBotoesObservacao(lista);
    }
});

document.getElementById("historicoLista")?.addEventListener("click", (event) => {
    const botao = event.target.closest(".registro-observacao-mais");
    if (!botao) {
        return;
    }

    const texto = document.getElementById(botao.getAttribute("aria-controls"));
    if (!texto) {
        return;
    }

    const expandido = botao.getAttribute("aria-expanded") !== "true";
    botao.setAttribute("aria-expanded", String(expandido));
    texto.classList.toggle("expandido", expandido);
    botao.textContent = expandido ? "Ler menos" : "Ler mais";
});

// EDIÇÃO DE REGISTROS
function editarRegistro(index) {
    const registro = registros[index];
    if (!registro) return;
    salvandoEdicaoRegistro = false;
    const botaoSalvar = document.querySelector("#formEdicaoRegistro button[type='submit']");
    if (botaoSalvar) {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar alterações";
    }
    indiceRegistroEdicao = index;
    document.getElementById("editRegistroGlicemia").value =
        registro.glicemiaAcimaDoLimite ? "" : (registro.glicemia || "");
    document.getElementById("editRegistroDose").value = registro.dose || "";
    document.getElementById("editRegistroHora").value = registro.hora || "";
    document.getElementById("editRegistroData").value = registro.dataIso || "";
    document.getElementById("editRegistroData").max = hojeIso();
    document.getElementById("editRegistroRefeicao").value = registro.refeicao || "☕ Café da Manhã";
    document.getElementById("editRegistroObservacao").value = registro.observacao || "";
    const modal = document.getElementById("modalEdicaoRegistro");
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalEdicao() {
    const modal = document.getElementById("modalEdicaoRegistro");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
    indiceRegistroEdicao = -1;
}

async function salvarEdicaoRegistro(event) {
    event.preventDefault();
    if (salvandoEdicaoRegistro || indiceRegistroEdicao < 0) return;

    const registro = registros[indiceRegistroEdicao];
    const glicemia = document.getElementById("editRegistroGlicemia").value;
    const dose = document.getElementById("editRegistroDose").value;
    const hora = document.getElementById("editRegistroHora").value;
    const data = document.getElementById("editRegistroData").value;
    const refeicao = document.getElementById("editRegistroRefeicao").value;
    const observacao = document.getElementById("editRegistroObservacao").value.trim();

    if (!hora || !data || !refeicao || (glicemia === "" && !registro.glicemiaAcimaDoLimite)) {
        alert("Preencha glicemia, data, horário e refeição.");
        return;
    }

    if (glicemia !== "" && (Number(glicemia) < 20 || Number(glicemia) > 600)) {
        alert("A glicemia deve estar entre 20 e 600 mg/dL.");
        return;
    }

    if (dose !== "" && (Number(dose) < 0 || Number(dose) > 100)) {
        alert("A dose deve estar entre 0 e 100 unidades.");
        return;
    }

    if (data > hojeIso()) {
        alert("A data não pode ser no futuro.");
        return;
    }

    salvandoEdicaoRegistro = true;
    const botaoSalvar = document.querySelector("#formEdicaoRegistro button[type='submit']");
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";
    }

    // Leitura "HI" sem número digitado continua HI; com número vira leitura normal.
    const continuaHi = registro.glicemiaAcimaDoLimite && (glicemia === "" || glicemia === "HI");

    try {
        await RegistroApi.atualizar(registro.id, {
            glicemia: continuaHi ? null : Number(glicemia),
            glicemiaAcimaDoLimite: continuaHi,
            dose: dose === "" ? 0 : Math.round(Number(dose) * 10) / 10,
            hora: `${hora}:00`,
            refeicao,
            data,
            observacao: observacao || null
        });
    } catch (erro) {
        alert(erro.message);
        salvandoEdicaoRegistro = false;
        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar alterações";
        }
        return;
    }

    if (botaoSalvar) botaoSalvar.textContent = "Salvo";
    fecharModalEdicao();
    await carregarHistorico();
}

function obterRefeicao(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    const horario = horas * 60 + minutos;
    if (horario <= 660) return "☕ Café da Manhã";
    if (horario <= 840) return "🍛 Almoço";
    if (horario <= 1080) return "🥪 Lanche";
    return "🍽️ Janta";
}

// Filtro de pesquisa
const pesquisa = document.getElementById("pesquisa");

if (pesquisa) {
    pesquisa.addEventListener("input", function () {
        const texto = pesquisa.value;
        const cards = document.querySelectorAll(".registro-item");

        cards.forEach((card, index) => {
            const corresponde = !texto || dataParaComparacao(registros[index]?.data) === texto;
            if (corresponde) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
}

const botaoBaixarPdf = document.getElementById("BaixarPdf");
const modalExportarPdf = document.getElementById("modalExportarPdf");
const formularioExportarPdf = document.getElementById("formExportarPdf");
const botaoFecharExportacao = document.getElementById("fecharExportarPdf");
const botaoCancelarExportacao = document.getElementById("cancelarExportarPdf");
const dataInicioPdf = document.getElementById("pdfDataInicio");
const dataFimPdf = document.getElementById("pdfDataFim");
const erroPdf = document.getElementById("pdfErro");

if (
    botaoBaixarPdf &&
    modalExportarPdf &&
    formularioExportarPdf &&
    botaoFecharExportacao &&
    botaoCancelarExportacao &&
    dataInicioPdf &&
    dataFimPdf &&
    erroPdf
) {
    const fecharModalExportacao = () => {
        modalExportarPdf.style.display = "none";
        modalExportarPdf.setAttribute("aria-hidden", "true");
        botaoBaixarPdf.focus();
    };

    botaoBaixarPdf.addEventListener("click", () => {
        erroPdf.hidden = true;
        erroPdf.textContent = "";
        modalExportarPdf.style.display = "flex";
        modalExportarPdf.setAttribute("aria-hidden", "false");
        dataInicioPdf.focus();
    });

    botaoFecharExportacao.addEventListener("click", fecharModalExportacao);
    botaoCancelarExportacao.addEventListener("click", fecharModalExportacao);
    modalExportarPdf.addEventListener("click", (event) => {
        if (event.target === modalExportarPdf) fecharModalExportacao();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalExportarPdf.getAttribute("aria-hidden") === "false") {
            fecharModalExportacao();
        }
    });

    formularioExportarPdf.addEventListener("submit", async (event) => {
        event.preventDefault();
        erroPdf.hidden = true;
        erroPdf.textContent = "";
        const inicio = dataInicioPdf.value;
        const fim = dataFimPdf.value;

        if (!inicio || !fim) {
            erroPdf.textContent = "Selecione as datas inicial e final para gerar o PDF.";
            erroPdf.hidden = false;
            return;
        }

        if (inicio > fim) {
            erroPdf.textContent = "A data inicial deve ser anterior ou igual à data final.";
            erroPdf.hidden = false;
            return;
        }

        try {
            await solicitarPdfAoBackend(inicio, fim);
            fecharModalExportacao();
        } catch (erro) {
            console.error("Não foi possível exportar o histórico em PDF.", erro);
            erroPdf.textContent = erro.message || "Não foi possível exportar o histórico em PDF.";
            erroPdf.hidden = false;
        }
    });
}

async function solicitarPdfAoBackend(dataInicio, dataFim) {
    const pdf = await RegistroApi.pdf(dataInicio, dataFim);

    const url = URL.createObjectURL(pdf);
    const link = document.createElement("a");
    const [ai, mi, di] = dataInicio.split("-");
    const [af, mf, df] = dataFim.split("-");
    link.href = url;
    link.download = `historico-glicemia-${di}-${mi}-${ai}-a-${df}-${mf}-${af}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Inicialização
window.addEventListener("load", () => {
    carregarHistorico();

    // Limita a digitação da glicemia a 600 (valores acima disso são exibidos como "HI")
    const glicemiaInput = document.getElementById("editRegistroGlicemia");
    if (glicemiaInput) {
        glicemiaInput.addEventListener("input", () => {
            if (Number(glicemiaInput.value) > 600) {
                glicemiaInput.value = 600;
            }
        });
    }

    const doseInput = document.getElementById("editRegistroDose");
    if (doseInput) {
        doseInput.addEventListener("input", () => {
            if (Number(doseInput.value) > 100) {
                doseInput.value = 100;
            }
            if (Number(doseInput.value) < 0) {
                doseInput.value = 0;
            }
        });
    }
});
document.getElementById("formEdicaoRegistro")?.addEventListener("submit", salvarEdicaoRegistro);
