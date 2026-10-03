// Estado da aplicação
// Os registros vêm da API (mais recentes primeiro). Veja carregarRegistros().
let registros = [];

// indiceEdicao guarda o índice do registro que está sendo editado. Valor -1 indica que não estamos editando.
let indiceEdicao = -1;
let salvandoRegistro = false;
let atualizarLimiteHorarioTimer = null;

// Referência ao objeto Chart (gráfico) para que possamos destruir e recriar quando os dados mudarem.
let grafico = null;

// Elementos do DOM
const modal = document.getElementById("modalRegistro");

// CONTROLE DO MODAL: cuida da abertura e fechamento do formulário de registro.
function abrirModal() {
    salvandoRegistro = false;
    const botaoSalvar = document.querySelector("#modalRegistro .form-submit");
    if (botaoSalvar) {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar registro";
    }
    modal.style.display = "flex";
    const data = document.getElementById("inputData");
    if (data && !data.value) {
        data.value = hojeIso();
    }
    if (data) {
        data.max = hojeIso();
    }
    const hora = document.getElementById("inputHora");
    if (hora && !hora.value) {
        hora.value = new Date().toTimeString().slice(0, 5);
    }
    atualizarLimiteHorarioRegistro();
    clearInterval(atualizarLimiteHorarioTimer);
    atualizarLimiteHorarioTimer = setInterval(atualizarLimiteHorarioRegistro, 30000);
    setTimeout(() => document.getElementById("inputHora")?.focus(), 0);
}

function fecharModal() {
    modal.style.display = "none";
    clearInterval(atualizarLimiteHorarioTimer);
    atualizarLimiteHorarioTimer = null;
    indiceEdicao = -1;

    document.getElementById("inputHora").value = "";
    document.getElementById("inputData").value = "";
    document.getElementById("inputGlicemia").value = "";
    document.getElementById("inputRefeicao").value = "";
    const inputDose = document.getElementById("inputDose");
    if (inputDose) {
        inputDose.value = "";
        inputDose.dataset.manual = "false";
    }  
    const inputObservacao = document.getElementById("inputObservacao");
    if (inputObservacao) {
        inputObservacao.value = "";
    }
}

// CLASSIFICAÇÃO DE REFEIÇÕES
// Determina a categoria da refeição com base no horário (HH:MM).
// A função converte a hora em minutos desde meia-noite e aplica faixas para identificar
// Café da Manhã, Almoço, Lanche ou Janta. Isso é usado ao salvar um registro para
// exibir o tipo de refeição no histórico e no dashboard.
function obterRefeicao(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    const horario = horas * 60 + minutos;

    if (horario <= 660) {
        return "Café da Manhã"; // até 11:00 (660min)
    }

    if (horario <= 840) {
        return "Almoço"; // até 14:00 (840min)
    }

    if (horario <= 1080) {
        return "Lanche"; // até 18:00 (1080min)
    }

    return "Jantar"; // após 18:00
}

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

function atualizarLimiteHorarioRegistro() {
    const data = document.getElementById("inputData");
    const hora = document.getElementById("inputHora");
    if (!data || !hora) return;

    data.max = hojeIso();
    if (data.value === hojeIso()) {
        const agora = new Date();
        hora.max = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    } else {
        hora.removeAttribute("max");
    }
}

function escaparHtmlDashboard(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Últimos 3 registros no mesmo formato visual do histórico
function renderizarUltimosRegistros() {
    const container = document.getElementById("ultimosRegistrosDashboard");
    if (!container) return;

    if (!registros.length) {
        container.innerHTML = '<p class="dashboard-empty">Nenhum registro realizado ainda.</p>';
        return;
    }

    container.innerHTML = registros.slice(0, 3).map((registro) => `
        <div class="registro-item">
            <div class="registro-main">
                <div class="registro-header">
                    <span class="metric-pill metric-glicemia">G</span>
                    <div>
                        <p class="registro-label">Glicemia</p>
                        <h3>${escaparHtmlDashboard(formatarGlicemia(registro.glicemia))}</h3>
                    </div>
                </div>
                <div class="registro-meta">
                    <div>
                        <span class="meta-label">Dose</span>
                        <strong>${Number(registro.dose) || 0} U</strong>
                    </div>
                    <div>
                        <span class="meta-label">Hora</span>
                        <strong>${escaparHtmlDashboard(registro.hora)}</strong>
                    </div>
                    <div>
                        <span class="meta-label">Data</span>
                        <strong>${escaparHtmlDashboard(registro.data)}</strong>
                    </div>
                    <div>
                        <span class="meta-label">Refeição</span>
                        <strong>${escaparHtmlDashboard(registro.refeicao || "Não informada")}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

// Atualização do resumo do dashboard
function atualizarResumoDashboard() {
    const ultimaGlicemia = document.getElementById("ultimaGlicemia");
    const ultimaDose = document.getElementById("ultimaDose");
    const ultimaHora = document.getElementById("ultimaHora");
    const ultimaRefeicao = document.getElementById("ultimaRefeicao");
    const ultimaGlicemiaResumo = document.getElementById("ultimaGlicemiaResumo");
    const ultimaInsulina = document.getElementById("ultimaInsulina");

    if (!registros.length) {
        if (ultimaGlicemia) ultimaGlicemia.innerText = "—";
        if (ultimaDose) ultimaDose.innerText = "0 U";
        renderizarUltimosRegistros();
        return;
    }

    const ultimoRegistro = registros[0];

    if (ultimaGlicemia) {
        ultimaGlicemia.innerText = formatarGlicemia(ultimoRegistro.glicemia);
    }

    if (ultimaDose) {
        ultimaDose.innerText = `${Number(ultimoRegistro.dose) || 0} U`;
    }

    if (ultimaHora) {
        ultimaHora.innerText = ultimoRegistro.hora;
    }

    if (ultimaRefeicao) {
        ultimaRefeicao.innerText = ultimoRegistro.refeicao || "Refeição não informada";
    }

    if (ultimaGlicemiaResumo) {
        ultimaGlicemiaResumo.innerText = formatarGlicemia(ultimoRegistro.glicemia);
    }

    if (ultimaInsulina) {
        ultimaInsulina.innerText = `${Number(ultimoRegistro.dose) || 0} U`;
    }
    renderizarUltimosRegistros();
}

// Busca os registros do usuário na API e atualiza resumo, lista e gráfico.
async function carregarRegistros() {
    try {
        const dados = await RegistroApi.listar(1, 50);
        registros = ordenarRegistrosRecentes(dados.map(registroDaApi));
    } catch (erro) {
        console.error("Não foi possível carregar os registros.", erro);
        const container = document.getElementById("ultimosRegistrosDashboard");
        if (container) {
            container.innerHTML = `<p class="dashboard-empty">${escaparHtmlDashboard(erro.message)}</p>`;
        }
        return;
    }
    atualizarResumoDashboard();
    criarGrafico();
}

// SALVAR REGISTRO
// Lê valores do formulário, valida e envia para a API.
async function salvarRegistro() {
    if (salvandoRegistro) return;

    const glicemiaInput = document.getElementById("inputGlicemia");
    const glicemia = glicemiaInput.value;
    const doseInput = document.getElementById("inputDose").value;
    const dose = doseInput == "" ? 0 : Math.round(Number(doseInput) * 10) / 10;
    const data = document.getElementById("inputData").value;
    const hora = document.getElementById("inputHora").value;
    const refeicao = document.getElementById("inputRefeicao").value;
    const observacao = document.getElementById("inputObservacao")?.value.trim() || "";

    if (glicemia === "" || data === "" || hora === "" || refeicao === "") {
        mostrarAlerta("Preencha glicemia, data, horário e refeição.");
        return;
    }
    atualizarLimiteHorarioRegistro();

    const valorGlicemia = Number(glicemia);
    if (!Number.isInteger(valorGlicemia) || valorGlicemia < 19 || valorGlicemia > 501) {
        mostrarAlerta("Informe uma glicemia entre 19 e 501 mg/dL. Use 19 para LO e 501 para HI.");
        glicemiaInput.focus();
        return;
    }

    if (data > hojeIso() || dataHoraFutura(data, hora)) {
        mostrarAlerta("A data e o horário da medição não podem estar no futuro.");
        document.getElementById("inputHora").focus();
        return;
    }

    if (dose < 0 || dose > 100) {
        mostrarAlerta("A dose deve estar entre 0 e 100 unidades.");
        return;
    }

    salvandoRegistro = true;
    const botaoSalvar = document.querySelector("#modalRegistro .form-submit");
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";
    }

    try {
        await RegistroApi.criar({
            glicemia: valorGlicemia === 501 ? null : valorGlicemia,
            glicemiaAcimaDoLimite: valorGlicemia === 501,
            dose,
            hora: `${hora}:00`,
            refeicao,
            data,
            observacao: observacao || null
        });
    } catch (erro) {
        mostrarAlerta(erro.message);
        salvandoRegistro = false;
        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar registro";
        }
        return;
    }

    if (botaoSalvar) botaoSalvar.textContent = "Salvo";
    mostrarNotificacao("Registro salvo com sucesso.");
    fecharModal();
    await carregarRegistros();
}

// GRÁFICO GLICÊMICO
// Cria ou atualiza o gráfico de glicemia usando Chart.js com os últimos registros.
// - Seleciona até 7 registros mais recentes
// - Constrói labels (horários) e dataset (valores numéricos)
// - Mantém a responsividade e destrói o gráfico anterior se existir
function criarGrafico() {
    const ctx = document.getElementById("graficoGlicemia");

    if (!ctx || typeof Chart === "undefined") {
        return; // sem canvas ou Chart.js não carregou (CDN fora do ar): segue sem gráfico
    }

    if (grafico) {
        grafico.destroy(); // remove instância anterior para evitar sobreposição
    }

    // O armazenamento mantém o registro mais recente na primeira posição.
    // Para preservar o fluxo FIFO visual, a janela dos últimos 7 é invertida:
    // o registro mais antigo aparece à esquerda e o mais recente à direita.
    const ultimos = registros.slice(0, 7).reverse();

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            labels: ultimos.map((registro) => {
                const variosDias = new Set(ultimos.map((r) => r.data)).size > 1;
                return variosDias ? `${registro.data.slice(0, 5)} ${registro.hora}` : registro.hora;
            }),
            datasets: [{
                label: "Glicemia",
                data: ultimos.map((registro) => registro.glicemiaAcimaDoLimite
                    ? 500
                    : Math.min(Number(registro.glicemia) || 0, 500)),
                borderColor: "#c0392b",
                backgroundColor: "rgba(192, 57, 43, .15)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 500,
                    ticks: {
                        stepSize: 100,
                        font: {
                            size: 12 * (Number(localStorage.getItem("acessibilidade-tamanho-fonte")) || 1)
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const registro = ultimos[context.dataIndex];
                            return `Glicemia: ${formatarGlicemia(registro.glicemia)}`;
                        }
                    }
                }
            }
        }
    });
}

window.addEventListener("accessibilityfontsizechange", () => {
    if (!grafico) return;
    grafico.options.scales.y.ticks.font.size =
        12 * (Number(localStorage.getItem("acessibilidade-tamanho-fonte")) || 1);
    grafico.update();
});

function obterConfiguracaoDose() {
    const profile = JSON.parse(localStorage.getItem("profile") || "null");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const config = profile || usuario || {};

    return {
        fatorSensibilidade: Number(config.fatorSensibilidade ?? 0),
        hgtAlvo: Number(config.hgtAlvo ?? 0)
    };
}

function calcularDoseCorrecao(hgtAtual = null) {
    const input = document.getElementById("inputHGT");
    const resultadoEl = document.getElementById("resultadoInsulina");
    const valorHgt = hgtAtual !== null ? Number(hgtAtual) : parseFloat(input?.value || localStorage.getItem("ultimoHGT") || "0");

    if (!resultadoEl) return null;

    if (isNaN(valorHgt) || valorHgt <= 0) {
        resultadoEl.innerText = "Insira HGT válido";
        resultadoEl.style.color = "red";
        localStorage.removeItem('ultimoHGT');
        return null;
    }

    const { fatorSensibilidade, hgtAlvo } = obterConfiguracaoDose();
    if (!fatorSensibilidade || !hgtAlvo) {
        resultadoEl.innerText = "Configure fator e HGT alvo no cadastro/perfil";
        resultadoEl.style.color = "orange";
        return null;
    }

    localStorage.setItem('ultimoHGT', String(valorHgt));

    const dose = (valorHgt - hgtAlvo) / fatorSensibilidade;
    const doseFinal = dose <= 0 ? 0 : Number(dose.toFixed(1));

    resultadoEl.innerText = `Dose de correção: ${doseFinal} U`;
    resultadoEl.style.color = "#0d9e6e";

    localStorage.setItem('ultimoInsulinaEstimada', String(doseFinal));
    return doseFinal;
}

function preencherDoseSugerida() {
    const inputDoseModal = document.getElementById('inputDose');
    if (!inputDoseModal) return;

    const doseSugerida = calcularDoseCorrecao();
    if (doseSugerida === null) {
        inputDoseModal.value = '';
        return;
    }

    if (inputDoseModal.dataset.manual !== 'true') {
        inputDoseModal.value = String(doseSugerida);
    }
}

// CARREGAMENTO DO DASHBOARD
// Quando a página carrega, inicializamos o resumo, o gráfico e o campo de HGT usando os dados em localStorage.
window.addEventListener("load", () => {
    // Mostra o estado vazio enquanto busca os dados na API
    atualizarResumoDashboard();
    carregarRegistros();

    const inputHGT = document.getElementById("inputHGT");
    if (inputHGT) {
        inputHGT.addEventListener("input", calcularDoseCorrecao);
        calcularDoseCorrecao();
    }

    const inputDoseModal = document.getElementById('inputDose');
    if (inputDoseModal) {
        inputDoseModal.addEventListener('input', function () {
            inputDoseModal.dataset.manual = 'true';
            if (Number(inputDoseModal.value) > 100) inputDoseModal.value = 100;
            if (Number(inputDoseModal.value) < 0) inputDoseModal.value = 0;
        });
    }

    const inputData = document.getElementById("inputData");
    inputData?.addEventListener("change", atualizarLimiteHorarioRegistro);
    inputData?.addEventListener("input", atualizarLimiteHorarioRegistro);
    const inputHora = document.getElementById("inputHora");
    inputHora?.addEventListener("focus", atualizarLimiteHorarioRegistro);
    inputHora?.addEventListener("input", atualizarLimiteHorarioRegistro);
    atualizarLimiteHorarioRegistro();
});
