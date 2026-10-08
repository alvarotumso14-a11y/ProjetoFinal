// Estado do histórico: registros vindos da API (mais recentes primeiro).
let registros = [];
let atualizarLimiteHorarioEdicaoTimer = null;

async function carregarHistorico() {
    const lista = document.getElementById("historicoLista");
    try {
        const dados = await RegistroApi.listar(1, 500);
        registros = ordenarRegistrosRecentes(dados.map(registroDaApi));
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

    if (textoValor === "HI" || (Number.isFinite(numero) && numero >= 501)) {
        return "HI";
    }

    if (textoValor === "LO" || numero === 19 || (Number.isFinite(numero) && numero < 20)) {
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

function formatarDataCompleta(dataIso) {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date(ano, mes - 1, dia, 12));
}

function atualizarLimiteHorarioEdicao() {
    const data = document.getElementById("editRegistroData");
    const hora = document.getElementById("editRegistroHora");
    if (!data || !hora) return;

    data.max = hojeIso();
    if (data.value === hojeIso()) {
        const agora = new Date();
        hora.max = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    } else {
        hora.removeAttribute("max");
    }
}

function dataLocalIso(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

// HISTÓRICO DE MEDIÇÕES
// atualiza a lista de registros exibida na página de histórico.
// Constrói os elementos HTML a partir dos registros carregados da API.
function atualizarHistorico() {
    const lista = document.getElementById("historicoLista");

    if (!lista) {
        return;
    }

    const periodoAtivo = document.querySelector(".filtro-periodo.ativo")?.dataset.periodo || "todos";
    const dataPesquisa = pesquisa?.value || "";
    const hoje = new Date();
    const hojeIso = dataLocalIso(hoje);
    const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1, 12);
    const ontemIso = dataLocalIso(ontem);
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
    const diasDesdeSegunda = (inicioSemana.getDay() + 6) % 7;
    inicioSemana.setDate(inicioSemana.getDate() - diasDesdeSegunda);
    const inicioSemanaIso = dataLocalIso(inicioSemana);

    const registrosFiltrados = registros
        .map((registro, indice) => ({ registro, indice }))
        .filter(({ registro }) => {
            const dataRegistro = registro.dataIso || dataParaComparacao(registro.data);
            if (dataPesquisa) return dataRegistro === dataPesquisa;
            if (periodoAtivo === "hoje") return dataRegistro === hojeIso;
            if (periodoAtivo === "ontem") return dataRegistro === ontemIso;
            if (periodoAtivo === "semana") return dataRegistro >= inicioSemanaIso && dataRegistro <= hojeIso;
            return true;
        });

    if (registrosFiltrados.length === 0) {
        const mensagem = registros.length === 0
            ? "Nenhum registro encontrado."
            : "Nenhum registro encontrado para este período.";
        lista.innerHTML = `
            <p class="historico-vazio">${mensagem}</p>
        `;
        return;
    }

    const gruposPorData = new Map();
    registrosFiltrados.forEach((item) => {
        const dataIso = item.registro.dataIso || dataParaComparacao(item.registro.data);
        if (!gruposPorData.has(dataIso)) gruposPorData.set(dataIso, []);
        gruposPorData.get(dataIso).push(item);
    });

    lista.innerHTML = Array.from(gruposPorData, ([dataIso, itens], indiceGrupo) => `
        <details class="historico-dia"${indiceGrupo === 0 ? " open" : ""}>
            <summary>
                <time datetime="${escaparHtml(dataIso)}">${escaparHtml(formatarDataCompleta(dataIso))}</time>
                <span class="historico-dia-contagem">${itens.length} ${itens.length === 1 ? "medição" : "medições"}</span>
            </summary>
            <div class="historico-dia-registros">
            ${itens.map(({ registro, indice }) => `
            <article class="registro-item">
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
                            <strong>${escaparHtml(formatarDataCompleta(dataIso))}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Refeição</span>
                            <strong>${escaparHtml(registro.refeicao)}</strong>
                        </div>
                    </div>
                    ${registro.observacao ? `
                        <div class="registro-observacao">
                            <span>Observação</span>
                            <span class="registro-observacao-texto" id="observacao-${indice}">${escaparHtml(registro.observacao)}</span>
                            <button class="registro-observacao-mais" type="button" aria-expanded="false" aria-controls="observacao-${indice}" hidden>Ler mais</button>
                        </div>
                    ` : ""}
                </div>

                <div class="botoesRegistro">
                    <button class="editar" type="button" onclick="editarRegistro(${indice})">
                        Alterar
                    </button>
                </div>
            </article>
            `).join("")}
            </div>
        </details>
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

window.addEventListener("accessibilityfontsizechange", () => {
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
        registro.glicemiaAcimaDoLimite ? "501" : (registro.glicemia ?? "");
    document.getElementById("editRegistroDose").value = registro.dose || "";
    document.getElementById("editRegistroHora").value = registro.hora || "";
    document.getElementById("editRegistroData").value = registro.dataIso || "";
    document.getElementById("editRegistroData").max = hojeIso();
    atualizarLimiteHorarioEdicao();
    document.getElementById("editRegistroRefeicao").value = registro.refeicao || "Café da Manhã";
    document.getElementById("editRegistroObservacao").value = registro.observacao || "";
    const modal = document.getElementById("modalEdicaoRegistro");
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    clearInterval(atualizarLimiteHorarioEdicaoTimer);
    atualizarLimiteHorarioEdicaoTimer = setInterval(atualizarLimiteHorarioEdicao, 30000);
}

function fecharModalEdicao() {
    const modal = document.getElementById("modalEdicaoRegistro");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
    clearInterval(atualizarLimiteHorarioEdicaoTimer);
    atualizarLimiteHorarioEdicaoTimer = null;
    indiceRegistroEdicao = -1;
}

async function salvarEdicaoRegistro(event) {
    event.preventDefault();
    if (salvandoEdicaoRegistro || indiceRegistroEdicao < 0) return;

    const registro = registros[indiceRegistroEdicao];
    const glicemia = document.getElementById("editRegistroGlicemia").value.trim().toUpperCase();
    const dose = document.getElementById("editRegistroDose").value;
    const hora = document.getElementById("editRegistroHora").value;
    const data = document.getElementById("editRegistroData").value;
    atualizarLimiteHorarioEdicao();
    const refeicao = document.getElementById("editRegistroRefeicao").value;
    const observacao = document.getElementById("editRegistroObservacao").value.trim();

    if (!hora || !data || !refeicao || (glicemia === "" && !registro.glicemiaAcimaDoLimite)) {
        mostrarAlerta("Preencha glicemia, data, horário e refeição.");
        return;
    }

    const valorGlicemia = Number(glicemia);
    if (!Number.isInteger(valorGlicemia) || valorGlicemia < 19 || valorGlicemia > 501) {
        mostrarAlerta("Informe uma glicemia entre 19 e 501 mg/dL. Use 19 para LO e 501 para HI.");
        return;
    }

    if (dose !== "" && (Number(dose) < 0 || Number(dose) > 100)) {
        mostrarAlerta("A dose deve estar entre 0 e 100 unidades.");
        return;
    }

    if (data > hojeIso() || dataHoraFutura(data, hora)) {
        mostrarAlerta("A data e o horário do registro não podem estar no futuro.");
        document.getElementById("editRegistroHora").focus();
        return;
    }

    salvandoEdicaoRegistro = true;
    const botaoSalvar = document.querySelector("#formEdicaoRegistro button[type='submit']");
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";
    }

    const continuaHi = valorGlicemia === 501;

    try {
        await RegistroApi.atualizar(registro.id, {
            glicemia: continuaHi ? null : Number(glicemia),
            glicemiaAcimaDoLimite: continuaHi,
            dose: dose === "" ? 0 : Math.round(Number(dose) * 10) / 10,
            hora: `${hora}:00`,
            refeicao: refeicaoParaApi(refeicao),
            data,
            observacao: observacao || null
        });
    } catch (erro) {
        mostrarAlerta(erro.message);
        salvandoEdicaoRegistro = false;
        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar alterações";
        }
        return;
    }

    if (botaoSalvar) botaoSalvar.textContent = "Salvo";
    mostrarNotificacao("Registro atualizado com sucesso.");
    fecharModalEdicao();
    await carregarHistorico();
}

function obterRefeicao(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    const horario = horas * 60 + minutos;
    if (horario <= 660) return "Café da Manhã";
    if (horario <= 840) return "Almoço";
    if (horario <= 1080) return "Lanche";
    return "Jantar";
}

const pesquisa = document.getElementById("pesquisa");

if (pesquisa) {
    pesquisa.addEventListener("input", () => {
        document.querySelectorAll(".filtro-periodo").forEach((botao) => {
            const ativo = !pesquisa.value && botao.dataset.periodo === "todos";
            botao.classList.toggle("ativo", ativo);
            botao.setAttribute("aria-pressed", String(ativo));
        });
        atualizarHistorico();
    });
}

document.querySelectorAll(".filtro-periodo").forEach((botao) => {
    botao.addEventListener("click", () => {
        pesquisa.value = "";
        document.querySelectorAll(".filtro-periodo").forEach((outroBotao) => {
            const ativo = outroBotao === botao;
            outroBotao.classList.toggle("ativo", ativo);
            outroBotao.setAttribute("aria-pressed", String(ativo));
        });
        atualizarHistorico();
    });
});

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
    link.download = `GlicHelp-${di}-${mi}-${ai}-a-${df}-${mf}-${af}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Inicialização
window.addEventListener("load", () => {
    carregarHistorico();



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
document.getElementById("editRegistroData")?.addEventListener("input", atualizarLimiteHorarioEdicao);
document.getElementById("editRegistroData")?.addEventListener("change", atualizarLimiteHorarioEdicao);
document.getElementById("editRegistroHora")?.addEventListener("focus", atualizarLimiteHorarioEdicao);
document.getElementById("editRegistroHora")?.addEventListener("input", atualizarLimiteHorarioEdicao);
