// Mantém funcionalidade antiga (se houver campo hgt/resultado na página)
function calcularInsulina() {
    const el = document.getElementById('hgt');
    const resultado = document.getElementById('resultado');
    if (!el || !resultado) return;

    const hgt = parseFloat(el.value);

    if (isNaN(hgt) || hgt <= 0) {
        resultado.textContent = "Por favor, insira um valor válido para o HGT.";
        resultado.style.color = "red";
        return;
    }

    // Fórmula exemplo (mantida por compatibilidade)
    let insulina = 0;
    if (hgt > 180) {
        insulina = (hgt - 100) / 30; // Exemplo de cálculo antigo
    } else {
        insulina = 0; // Não é necessário insulina
    }

    resultado.style.color = "#0d9e6e"; // Verde para resultado positivo
    resultado.textContent = `A quantidade de insulina recomendada é: ${insulina.toFixed(1)} unidades.`;
}

// Integração com dashboard: usa último HGT salvo em localStorage e as configurações do usuário
function mostrarEstimativaDaDashboard() {
    const container = document.getElementById('calcResultado'); // bloco principal de resultado na Calculadora.html
    if (!container) return;

    // Cria elemento para mostrar estimativa de insulina com base no HGT do dashboard
    let elEstimativa = document.getElementById('estimativaInsulinaDashboard');
    if (!elEstimativa) {
        elEstimativa = document.createElement('div');
        elEstimativa.id = 'estimativaInsulinaDashboard';
        elEstimativa.style.marginTop = '12px';
        elEstimativa.style.fontWeight = '600';
        container.appendChild(elEstimativa);
    }

    const ultimoHGT = localStorage.getItem('ultimoHGT');
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!ultimoHGT) {
        elEstimativa.innerText = 'Nenhum HGT recente encontrado. Use o campo no Dashboard.';
        elEstimativa.style.color = 'gray';
        return;
    }

    if (!usuario || usuario.fatorSensibilidade == null || usuario.qtdGramas == null) {
        elEstimativa.innerText = 'Configurações de fator/gramas não encontradas. Atualize no cadastro.';
        elEstimativa.style.color = 'orange';
        return;
    }

    const hgt = Number(ultimoHGT);
    const fator = Number(usuario.fatorSensibilidade);
    const qnt = Number(usuario.qtdGramas);
    if (!qnt) {
        elEstimativa.innerText = 'Quantidade de gramas inválida nas configurações.';
        elEstimativa.style.color = 'red';
        return;
    }

    const insulina = (hgt - fator) / qnt;
    const insulinaFmt = insulina <= 0 ? 0 : Number(insulina.toFixed(1));
    elEstimativa.innerText = `Estimativa a partir do último HGT (${hgt} mg/dL): ${insulinaFmt} U`;
    elEstimativa.style.color = '#0d9e6e';
}

// Executa ao carregar a página da calculadora
window.addEventListener('load', () => {
    // Exibe a estimativa com base no dashboard, se disponível
    mostrarEstimativaDaDashboard();

    // Se houver botão de calcular do formulário de HbA1c, conecta o evento
    const btn = document.getElementById('btnCalcular');
    if (btn) {
        btn.addEventListener('click', () => {
            // A página original fazia cálculo de HbA1c; manter comportamento original se necessário
            // Caso queira usar o campo de glicemia média para outra lógica, adaptar aqui.
            // Nenhuma alteração adicional feita para o cálculo de HbA1c neste commit.
        });
    }
});
