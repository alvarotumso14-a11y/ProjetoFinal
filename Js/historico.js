// Estado do histórico
// LOCAL STORAGE: carrega os registros salvos (persistidos pelo dashboard) para exibir o histórico.
// Se não existir chave, inicializa com array vazio.
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let indiceRegistroEdicao = -1;

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
    indiceRegistroEdicao = index;
    document.getElementById("editRegistroGlicemia").value = registro.glicemia || "";
    document.getElementById("editRegistroDose").value = registro.dose || "";
    document.getElementById("editRegistroHora").value = registro.hora || "";
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

function salvarEdicaoRegistro(event) {
    event.preventDefault();
    if (indiceRegistroEdicao < 0) return;
    const registro = registros[indiceRegistroEdicao];
    registro.glicemia = document.getElementById("editRegistroGlicemia").value;
    registro.dose = document.getElementById("editRegistroDose").value;
    registro.hora = document.getElementById("editRegistroHora").value;
    registro.observacao = document.getElementById("editRegistroObservacao").value.trim();
    localStorage.setItem("registros", JSON.stringify(registros));
    atualizarHistorico();
    fecharModalEdicao();
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
    /*
     * Ponto de integração com o backend:
     * 1. Configure a URL/rota e o método HTTP conforme o contrato da API.
     * 2. Ajuste os nomes e o formato dos parâmetros para dataInicio/dataFim
     *    (por exemplo, query string ou JSON no corpo da requisição).
     * 3. Inclua aqui os cabeçalhos de autenticação exigidos pelo backend.
     * 4. Quando o endpoint estiver pronto, leia a resposta como Blob e dispare
     *    o download usando URL.createObjectURL; o endpoint deve retornar PDF.
     * A URL base existente para a API fica em Js/Api.js (API_BASE_URL).
     */
    void dataInicio;
    void dataFim;
    throw new Error("A exportação em PDF ainda precisa ser conectada ao endpoint do backend.");
}

// Inicialização
window.addEventListener("load", () => {
    atualizarHistorico();

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
            if (Number(doseInput.value) > 600) {
                doseInput.value = 600;
            }
        });
    }
});
document.getElementById("formEdicaoRegistro")?.addEventListener("submit", salvarEdicaoRegistro);
