// Estado do histórico
let registros = JSON.parse(localStorage.getItem("registros")) || [];

// Funções de exibição
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
            <div class="registro">
                <div class="infoRegistro">
                    <h3>🩸 ${registro.glicemia} mg/dL</h3>
                    <p>💉 ${registro.dose} U</p>
                    <p>🕒 ${registro.hora}</p>
                    <p>📅 ${registro.data}</p>
                </div>

                <div class="botoesRegistro">
                    <button class="editar" onclick="editarRegistro(${index})">
                        Alterar
                    </button>

                    <button class="excluir" onclick="excluirRegistro(${index})">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    });
}

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
