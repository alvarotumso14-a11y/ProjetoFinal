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

    lista.innerHTML = "";

    if (registros.length === 0) {
        lista.innerHTML = `
            <div class="registro">
                <h3>Nenhum registro encontrado.</h3>
            </div>
        `;
        return;
    }

    registros.forEach((registro, index) => {
        lista.innerHTML += `
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
                    ${registro.observacao ? `<p class="registro-observacao"><span>Observação</span>${escaparHtml(registro.observacao)}</p>` : ""}
                </div>

                <div class="botoesRegistro">
                    <button class="editar" onclick="editarRegistro(${index})">
                        Alterar
                    </button>
                </div>
            </div>
        `;
    });
}

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

        cards.forEach((card) => {
            const index = Array.from(cards).indexOf(card);
            const corresponde = !texto || dataParaComparacao(registros[index]?.data) === texto;
            if (corresponde) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
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
