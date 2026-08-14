// Estado da aplicação
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let indiceEdicao = -1;
let grafico = null;
let etapa = 0;

// Elementos do DOM
const modal = document.getElementById("modalRegistro");
const passos = document.querySelectorAll(".step");

// Funções do modal
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

// Regras de refeição
function obterRefeicao(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    const horario = horas * 60 + minutos;

    if (horario <= 660) {
        return "☕ Café da Manhã";
    }

    if (horario <= 840) {
        return "🍛 Almoço";
    }

    if (horario <= 1080) {
        return "🥪 Lanche";
    }

    return "🍽️ Janta";
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

// Salvar e exibir registro
function salvarRegistro() {
    const glicemia = document.getElementById("inputGlicemia").value;
    const dose = document.getElementById("inputDose").value;
    const hora = document.getElementById("inputHora").value;
    const refeicao = obterRefeicao(hora);

    if (glicemia === "" || dose === "" || hora === "") {
        alert("Preencha todos os campos!");
        return;
    }

    if (indiceEdicao >= 0) {
        registros[indiceEdicao].glicemia = glicemia;
        registros[indiceEdicao].dose = dose;
        registros[indiceEdicao].hora = hora;
        registros[indiceEdicao].refeicao = refeicao;
        indiceEdicao = -1;
    } else {
        registros.unshift({
            glicemia,
            dose,
            hora,
            refeicao,
            data: new Date().toLocaleDateString("pt-BR")
        });
    }

    localStorage.setItem("registros", JSON.stringify(registros));
    atualizarResumoDashboard();
    fecharModal();
    criarGrafico();
}

// Gráfico
function criarGrafico() {
    const ctx = document.getElementById("graficoGlicemia");

    if (!ctx) {
        return;
    }

    if (grafico) {
        grafico.destroy();
    }

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

// Inicialização
window.addEventListener("load", () => {
    atualizarResumoDashboard();
    criarGrafico();
});
