// Estado da aplicação
// LOCAL STORAGE: registros é carregado do localStorage para persistir os registros entre sessões.
// Ao salvar, os registros são gravados em localStorage (JSON) para que persistam após reload/fechar o navegador.
let registros = JSON.parse(localStorage.getItem("registros")) || [];

// indiceEdicao guarda o índice do registro que está sendo editado. Valor -1 indica que não estamos editando.
let indiceEdicao = -1;

// Referência ao objeto Chart (gráfico) para que possamos destruir e recriar quando os dados mudarem.
let grafico = null;

// etapa controla a etapa atual do modal de registro (uso em navegação entre etapas do formulário)
let etapa = 0;

// Elementos do DOM
const modal = document.getElementById("modalRegistro");
const passos = document.querySelectorAll(".step");

// CONTROLE DO MODAL: as funções abaixo (abrirModal, fecharModal, proximoPasso, atualizarPassos)
// cuidam da abertura/fechamento do modal e da navegação entre as etapas do formulário.
function abrirModal() {
    modal.style.display = "flex";
    etapa = 0;
    atualizarPassos();
}

function fecharModal() {
    modal.style.display = "none";
    indiceEdicao = -1;

    document.getElementById("inputHora").value = "";
    document.getElementById("inputGlicemia").value = "";
    document.getElementById("inputDose").value = "";
}

function proximoPasso() {
    if (etapa < passos.length - 1) {
        etapa++;
        atualizarPassos();
    }
}

function atualizarPassos() {
    passos.forEach((passo) => passo.classList.remove("active"));
    passos[etapa].classList.add("active");
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
        return "☕ Café da Manhã"; // até 11:00 (660min)
    }

    if (horario <= 840) {
        return "🍛 Almoço"; // até 14:00 (840min)
    }

    if (horario <= 1080) {
        return "🥪 Lanche"; // até 18:00 (1080min)
    }

    return "🍽️ Janta"; // após 18:00
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
        return;
    }

    const ultimoRegistro = registros[0];

    if (ultimaGlicemia) {
        ultimaGlicemia.innerText = `${ultimoRegistro.glicemia} mg/dL`;
    }

    if (ultimaDose) {
        ultimaDose.innerText = `${ultimoRegistro.dose} U`;
    }

    if (ultimaHora) {
        ultimaHora.innerText = ultimoRegistro.hora;
    }

    if (ultimaRefeicao) {
        ultimaRefeicao.innerText = ultimoRegistro.refeicao;
    }

    if (ultimaGlicemiaResumo) {
        ultimaGlicemiaResumo.innerText = `${ultimoRegistro.glicemia} mg/dL`;
    }

    if (ultimaInsulina) {
        ultimaInsulina.innerText = `${ultimoRegistro.dose} U`;
    }
}

// SALVAR REGISTRO
// Lê valores do formulário, valida, e cria ou atualiza um registro.
// Depois persiste em localStorage e atualiza a UI (resumo e gráfico).
function salvarRegistro() {
    const glicemia = document.getElementById("inputGlicemia").value;
    const dose = document.getElementById("inputDose").value;
    const hora = document.getElementById("inputHora").value;
    const refeicao = obterRefeicao(hora);

    // Validação simples: exige que os campos não estejam vazios.
    if (glicemia === "" || dose === "" || hora === "") {
        alert("Preencha todos os campos!");
        return;
    }

    // Se estivermos editando um registro existente, atualiza o objeto.
    if (indiceEdicao >= 0) {
        registros[indiceEdicao].glicemia = glicemia;
        registros[indiceEdicao].dose = dose;
        registros[indiceEdicao].hora = hora;
        registros[indiceEdicao].refeicao = refeicao;
        indiceEdicao = -1;
    } else {
        // Senão, adiciona novo registro no início do array (mais recente primeiro).
        registros.unshift({
            glicemia,
            dose,
            hora,
            refeicao,
            data: new Date().toLocaleDateString("pt-BR")
        });
    }

    // Persiste os registros em localStorage (chave: 'registros') em formato JSON.
    localStorage.setItem("registros", JSON.stringify(registros));

    // Atualiza a interface: resumo, fecha modal e recria o gráfico com os novos dados.
    atualizarResumoDashboard();
    fecharModal();
    criarGrafico();
}

// GRÁFICO GLICÊMICO
// Cria ou atualiza o gráfico de glicemia usando Chart.js com os últimos registros.
// - Seleciona até 7 registros mais recentes
// - Constrói labels (horários) e dataset (valores numéricos)
// - Mantém a responsividade e destrói o gráfico anterior se existir
function criarGrafico() {
    const ctx = document.getElementById("graficoGlicemia");

    if (!ctx) {
        return; // página pode não ter canvas; nada a fazer
    }

    if (grafico) {
        grafico.destroy(); // remove instância anterior para evitar sobreposição
    }

    // Pega os últimos 7 registros (ou menos) e inverte para ordem cronológica no gráfico
    const ultimos = [...registros].slice(0, 7).reverse();

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            labels: ultimos.map((registro) => registro.hora),
            datasets: [{
                label: "Glicemia",
                data: ultimos.map((registro) => Number(registro.glicemia)),
                borderColor: "#c0392b",
                backgroundColor: "rgba(192, 57, 43, .15)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Calculadora integrada via HGT — usa configurações salvas no cadastro (localStorage 'usuario')
function calcularComHGT() {
    const input = document.getElementById("inputHGT");
    const resultadoEl = document.getElementById("resultadoInsulina");
    if (!input || !resultadoEl) return;
    const hgt = parseFloat(input.value);
    if (isNaN(hgt) || hgt <= 0) {
        resultadoEl.innerText = "Insira HGT válido";
        resultadoEl.style.color = "red";
        // Remove valor salvo se inválido
        localStorage.removeItem('ultimoHGT');
        return;
    }
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || usuario.fatorSensibilidade == null || usuario.qtdGramas == null) {
        resultadoEl.innerText = "Configure fator e gramas no cadastro";
        resultadoEl.style.color = "orange";
        return;
    }
    const fator = Number(usuario.fatorSensibilidade);
    const qnt = Number(usuario.qtdGramas);
    if (qnt === 0) {
        resultadoEl.innerText = "Quantidade de gramas inválida";
        resultadoEl.style.color = "red";
        return;
    }
    // Armazena último HGT para referência em outras páginas
    localStorage.setItem('ultimoHGT', String(hgt));

    // Fórmula: (hgt - fator) / quantidade_de_gramas
    const insulina = (hgt - fator) / qnt;
    const insulinaFmt = insulina <= 0 ? 0 : Number(insulina.toFixed(1));
    resultadoEl.innerText = `Insulina estimada: ${insulinaFmt} U`;
    resultadoEl.style.color = "#0d9e6e";

    // Salva estimativa e, se o modal de registro estiver aberto/visível, preenche o campo de dose
    localStorage.setItem('ultimoInsulinaEstimada', String(insulinaFmt));
    const inputDoseModal = document.getElementById('inputDose');
    if (inputDoseModal) {
        inputDoseModal.value = insulinaFmt;
    }
}

// CARREGAMENTO DO DASHBOARD
// Quando a página carrega, inicializamos o resumo, o gráfico e o campo de HGT usando os dados em localStorage.
window.addEventListener("load", () => {
    // Atualiza os elementos do resumo (última glicemia, dose, hora, etc.)
    atualizarResumoDashboard();
    // Gera o gráfico inicial com os dados disponíveis
    criarGrafico();

    const inputHGT = document.getElementById("inputHGT");
    if (inputHGT) {
        inputHGT.addEventListener("input", calcularComHGT);
        // Se já houver valor, calcula imediatamente
        calcularComHGT();
    }
});
