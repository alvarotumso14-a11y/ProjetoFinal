// Mantém funcionalidade antiga (se houver campo hgt/resultado na página)
function calcularInsulina() {
    const el = document.getElementById('hgt');
    const resultado = document.getElementById('resultado');
    if (!el || !resultado) return;

    const hgt = parseFloat(el.value);

    if (isNaN(hgt) || hgt <= 0) {
        resultado.textContent = 'Por favor, insira um valor válido para o HGT.';
        resultado.style.color = 'red';
        return;
    }

    const config = JSON.parse(localStorage.getItem('profile') || localStorage.getItem('usuario') || '{}');
    const fator = Number(config.fatorSensibilidade ?? 0);
    const hgtAlvo = Number(config.hgtAlvo ?? 0);
    if (!fator || !hgtAlvo) {
        resultado.textContent = 'Configure fator e HGT alvo no cadastro/perfil.';
        resultado.style.color = 'orange';
        return;
    }

    const dose = (hgt - hgtAlvo) / fator;
    const doseFinal = dose <= 0 ? 0 : Number(dose.toFixed(1));

    resultado.style.color = '#0d9e6e';
    resultado.textContent = `Dose de correção estimada: ${doseFinal} unidades.`;
}

// Integração com dashboard: usa último HGT salvo em localStorage e as configurações do usuário
function mostrarEstimativaDaDashboard() {
    const container = document.getElementById('calcResultado');
    if (!container) return;

    let elEstimativa = document.getElementById('estimativaInsulinaDashboard');
    if (!elEstimativa) {
        elEstimativa = document.createElement('div');
        elEstimativa.id = 'estimativaInsulinaDashboard';
        elEstimativa.style.marginTop = '12px';
        elEstimativa.style.fontWeight = '600';
        container.appendChild(elEstimativa);
    }

    const ultimoHGT = localStorage.getItem('ultimoHGT');
    const config = JSON.parse(localStorage.getItem('profile') || localStorage.getItem('usuario') || '{}');

    if (!ultimoHGT) {
        elEstimativa.innerText = 'Nenhum HGT recente encontrado. Use o campo no Dashboard.';
        elEstimativa.style.color = 'gray';
        return;
    }

    if (!config.fatorSensibilidade || !config.hgtAlvo) {
        elEstimativa.innerText = 'Fator e HGT alvo não encontrados. Atualize no cadastro/perfil.';
        elEstimativa.style.color = 'orange';
        return;
    }

    const hgt = Number(ultimoHGT);
    const fator = Number(config.fatorSensibilidade);
    const alvo = Number(config.hgtAlvo);
    const dose = (hgt - alvo) / fator;
    const doseFinal = dose <= 0 ? 0 : Number(dose.toFixed(1));

    elEstimativa.innerText = `Estimativa a partir do último HGT (${hgt} mg/dL): ${doseFinal} U`;
    elEstimativa.style.color = '#0d9e6e';
}

// Executa ao carregar a página da calculadora
window.addEventListener('load', () => {
    mostrarEstimativaDaDashboard();
});
