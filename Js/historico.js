// Estado do histórico
// LOCAL STORAGE: carrega os registros salvos (persistidos pelo dashboard) para exibir o histórico.
// Se não existir chave, inicializa com array vazio.
let registros = JSON.parse(localStorage.getItem("registros")) || [];

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
                            <h3>${registro.glicemia} mg/dL</h3>
                        </div>
                    </div>

                    <div class="registro-meta">
                        <div>
                            <span class="meta-label">Dose</span>
                            <strong>${registro.dose} U</strong>
                        </div>
                        <div>
                            <span class="meta-label">Hora</span>
                            <strong>${registro.hora}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Data</span>
                            <strong>${registro.data}</strong>
                        </div>
                    </div>
                </div>

                <div class="botoesRegistro">
                    <button class="editar" onclick="editarRegistro(${index})">
                        Alterar
                    </button>

                    <button class="excluir" onclick="excluirRegistro(${index})">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    });
}

// EDIÇÃO DE REGISTROS
// Permite alterar um registro existente usando prompts simples (implementação atual).
// Atualiza o array `registros` e persiste em localStorage, depois atualiza a lista exibida.
function editarRegistro(index) {
    const novaGlicemia = prompt("Nova glicemia:", registros[index].glicemia);
    if (novaGlicemia == null) {
        return;
    }

    const novaDose = prompt("Nova dose:", registros[index].dose);
    if (novaDose == null) {
        return;
    }

    const novaHora = prompt("Novo horário:", registros[index].hora);
    if (novaHora == null) {
        return;
    }

    registros[index].glicemia = novaGlicemia;
    registros[index].dose = novaDose;
    registros[index].hora = novaHora;

    // Persiste e atualiza a interface
    localStorage.setItem("registros", JSON.stringify(registros));
    atualizarHistorico();
}

function excluirRegistro(index) {
    const confirmar = confirm("Deseja realmente excluir este registro?");
    if (!confirmar) {
        return;
    }

    registros.splice(index, 1);
    localStorage.setItem("registros", JSON.stringify(registros));
    atualizarHistorico();
}

// Filtro de pesquisa
const pesquisa = document.getElementById("pesquisa");

if (pesquisa) {
    pesquisa.addEventListener("keyup", function () {
        const texto = pesquisa.value.toLowerCase();
        const cards = document.querySelectorAll(".registro");

        cards.forEach((card) => {
            if (card.innerText.toLowerCase().includes(texto)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
}

// Inicialização
window.addEventListener("load", atualizarHistorico);
