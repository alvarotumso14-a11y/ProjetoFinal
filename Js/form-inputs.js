(function (root) {
    function formatarTelefone(valor) {
        const numeros = String(valor || '').replace(/\D/g, '').slice(0, 11);
        if (!numeros) return '';
        if (numeros.length <= 2) return '(' + numeros;
        const ddd = '(' + numeros.slice(0, 2) + ') ';
        const telefone = numeros.slice(2);
        const corte = telefone.length > 8 ? 5 : 4;
        return ddd + telefone.slice(0, corte) + (telefone.length > corte ? '-' + telefone.slice(corte) : '');
    }
    function telefone(campo) {
        campo.value = formatarTelefone(campo.value);
        campo.addEventListener('input', () => {
            const posicao = campo.selectionStart ?? campo.value.length;
            const digitosAntes = campo.value.slice(0, posicao).replace(/\D/g, '').length;
            campo.value = formatarTelefone(campo.value);
            let novaPosicao = 0, vistos = 0;
            while (novaPosicao < campo.value.length && vistos < digitosAntes) {
                if (/\d/.test(campo.value[novaPosicao])) vistos++;
                novaPosicao++;
            }
            campo.setSelectionRange(novaPosicao, novaPosicao);
        });
    }
    function limitarInteiro(campo, maximo, aviso) {
        const valido = valor => valor === '' || /^\d+$/.test(valor) && Number(valor) <= maximo;
        let anterior = valido(campo.value) ? campo.value : '';
        campo.addEventListener('focus', () => { if (valido(campo.value)) anterior = campo.value; });
        campo.addEventListener('input', () => {
            const rejeitado = !valido(campo.value);
            if (rejeitado) campo.value = anterior;
            else anterior = campo.value;
            if (aviso) aviso.style.display = rejeitado ? 'block' : 'none';
        });
    }
    function limitarNumero(campo, maximo, aviso) {
        const minimo = Number(campo.min) || 0;
        const valido = valor => {
            if (valor === '') return true;
            if (!/^\d+(?:\.\d*)?$/.test(valor)) return false;
            const numero = Number(valor);
            return Number.isFinite(numero) && numero >= minimo && numero <= maximo;
        };
        let anterior = valido(campo.value) ? campo.value : '';
        campo.addEventListener('focus', () => {
            if (valido(campo.value)) anterior = campo.value;
        });
        campo.addEventListener('input', () => {
            const rejeitado = !valido(campo.value);
            if (rejeitado) campo.value = anterior;
            else anterior = campo.value;
            if (aviso) aviso.style.display = rejeitado ? 'block' : 'none';
        });
    }
    const api = { formatarTelefone, telefone, limitarInteiro, limitarNumero };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.FormInputs = api;
})(typeof window !== 'undefined' ? window : globalThis);
