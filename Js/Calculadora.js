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
        if (erro) erro.textContent = 'Configure o HGT alvo e o fator de sensibilidade no perfil.';
        return;
    }

    valor.textContent = `${dose.toFixed(1).replace('.', ',')} U`;
    classificacao.textContent = dose > 0 ? 'Correção necessária' : 'Sem correção';
    classificacao.className = dose > 0 ? 'classificacao normal' : 'classificacao risco';
    if (erro) erro.textContent = '';
}

function atualizarConfiguracaoPerfilNaTela() {
    const perfilEl = document.getElementById('configPerfil');
    if (!perfilEl) return;

    const config = getConfiguracaoDose();
    const alvo = config.hgtAlvo ? `${config.hgtAlvo} mg/dL` : 'não definido';
    const fator = config.fatorSensibilidade ? `${config.fatorSensibilidade}` : 'não definido';

    perfilEl.textContent = `Alvo: ${alvo} | Fator de sensibilidade: ${fator}`;
}

function calcularDoseCorrecaPagina() {
    const inputHgtAtual = document.getElementById('inputHgtAtual');
    const hgtAtual = parseFloat(inputHgtAtual?.value || '0');
    const config = getConfiguracaoDose();
    const hgtAlvo = config.hgtAlvo;
    const fatorSensibilidade = config.fatorSensibilidade;

    atualizarConfiguracaoPerfilNaTela();

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

    if (inputHgtAtual && config.hgtAtual) inputHgtAtual.value = config.hgtAtual;

    const btn = document.getElementById('btnCalcular');
    if (btn) {
        btn.addEventListener('click', calcularDoseCorrecaPagina);
    }

    if (inputHgtAtual) {
        inputHgtAtual.addEventListener('input', calcularDoseCorrecaPagina);
    }

    atualizarConfiguracaoPerfilNaTela();
    calcularDoseCorrecaPagina();
    mostrarEstimativaDaDashboard();
});
