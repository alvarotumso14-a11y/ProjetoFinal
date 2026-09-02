function getConfiguracaoDose() {
    const profile = JSON.parse(localStorage.getItem('profile') || 'null');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    const config = profile || usuario || {};

    return {
        hgtAtual: parseFloat(localStorage.getItem('ultimoHGT') || '0'),
        hgtAlvo: Number(config.hgtAlvo ?? 0),
        fatorSensibilidade: Number(config.fatorSensibilidade ?? 0)
    };
}

function calcularDoseCorrecaoDados(hgtAtual, hgtAlvo, fatorSensibilidade) {
    if (!hgtAtual || !hgtAlvo || !fatorSensibilidade) {
        return null;
    }

    const dose = (hgtAtual - hgtAlvo) / fatorSensibilidade;
    return dose <= 0 ? 0 : Number(dose.toFixed(1));
}

function renderizarResultadoDose(dose) {
    const resultado = document.getElementById('calcResultado');
    const valor = document.getElementById('calcValor');
    const classificacao = document.getElementById('calcClassificacao');
    const erro = document.getElementById('calcErro');

    if (!resultado || !valor || !classificacao) return;

    if (dose === null || isNaN(dose)) {
        valor.textContent = '0,0 U';
        classificacao.textContent = '—';
        classificacao.className = 'classificacao';
        if (erro) erro.textContent = 'Preencha HGT atual, HGT alvo e fator de sensibilidade.';
        return;
    }

    valor.textContent = `${dose.toFixed(1).replace('.', ',')} U`;
    classificacao.textContent = dose > 0 ? 'Correção necessária' : 'Sem correção';
    classificacao.className = dose > 0 ? 'classificacao normal' : 'classificacao risco';
    if (erro) erro.textContent = '';
}

function calcularDoseCorrecaPagina() {
    const inputHgtAtual = document.getElementById('inputHgtAtual');
    const inputHgtAlvo = document.getElementById('inputHgtAlvo');
    const inputFatorSensibilidade = document.getElementById('inputFatorSensibilidade');

    const hgtAtual = parseFloat(inputHgtAtual?.value || '0');
    const hgtAlvo = parseFloat(inputHgtAlvo?.value || '0');
    const fatorSensibilidade = parseFloat(inputFatorSensibilidade?.value || '0');

    if (!hgtAtual || !hgtAlvo || !fatorSensibilidade) {
        renderizarResultadoDose(null);
        return;
    }

    const dose = calcularDoseCorrecaoDados(hgtAtual, hgtAlvo, fatorSensibilidade);
    renderizarResultadoDose(dose);
}

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

    const config = getConfiguracaoDose();
    const dose = calcularDoseCorrecaoDados(hgt, config.hgtAlvo, config.fatorSensibilidade);
    resultado.style.color = '#0d9e6e';
    resultado.textContent = `Dose de correção estimada: ${dose === null ? 0 : dose} unidades.`;
}

// Integração com dashboard: usa último HGT salvo em localStorage e as configurações do usuário
function mostrarEstimativaDaDashboard() {
    const resultado = document.getElementById('calcResultado');
    if (!resultado) return;

    const config = getConfiguracaoDose();
    const ultimoHGT = config.hgtAtual;
    const dose = calcularDoseCorrecaoDados(ultimoHGT, config.hgtAlvo, config.fatorSensibilidade);

    renderizarResultadoDose(dose);
}

window.addEventListener('load', () => {
    const config = getConfiguracaoDose();
    const inputHgtAtual = document.getElementById('inputHgtAtual');
    const inputHgtAlvo = document.getElementById('inputHgtAlvo');
    const inputFatorSensibilidade = document.getElementById('inputFatorSensibilidade');

    if (inputHgtAtual && config.hgtAtual) inputHgtAtual.value = config.hgtAtual;
    if (inputHgtAlvo && config.hgtAlvo) inputHgtAlvo.value = config.hgtAlvo;
    if (inputFatorSensibilidade && config.fatorSensibilidade) inputFatorSensibilidade.value = config.fatorSensibilidade;

    const btn = document.getElementById('btnCalcular');
    if (btn) {
        btn.addEventListener('click', calcularDoseCorrecaPagina);
    }

    if (inputHgtAtual || inputHgtAlvo || inputFatorSensibilidade) {
        [inputHgtAtual, inputHgtAlvo, inputFatorSensibilidade].forEach((el) => {
            if (el) el.addEventListener('input', calcularDoseCorrecaPagina);
        });
    }

    calcularDoseCorrecaPagina();
    mostrarEstimativaDaDashboard();
});
