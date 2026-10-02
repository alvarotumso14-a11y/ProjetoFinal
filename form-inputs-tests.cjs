const assert = require('node:assert/strict');
const {formatarTelefone, telefone, limitarInteiro} = require('./Js/form-inputs.js');
function campo(valor = '') {
    const handlers = {};
    return {value: valor, selectionStart: valor.length,
        addEventListener: (evento, fn) => handlers[evento] = fn,
        setSelectionRange() {},
        disparar(evento) { handlers[evento]?.(); }};
}
assert.equal(formatarTelefone('11987654321'), '(11) 98765-4321');
assert.equal(formatarTelefone('1134567890'), '(11) 3456-7890');
assert.equal(formatarTelefone('abc119876543219999'), '(11) 98765-4321');
assert.equal(formatarTelefone(''), '');
const tel = campo('11987654321'); telefone(tel);
assert.equal(tel.value, '(11) 98765-4321');
tel.value = ''; tel.disparar('input'); assert.equal(tel.value, '');
for (const limite of [120, 600]) {
    const input = campo('25'), aviso = {style:{}};
    limitarInteiro(input, limite, aviso); input.disparar('focus');
    input.value = '999999999999999999999999'; input.disparar('input');
    assert.equal(input.value, '25'); assert.equal(aviso.style.display, 'block');
    input.value = String(limite); input.disparar('input'); assert.equal(input.value, String(limite));
    input.value = String(limite + 1); input.disparar('input'); assert.equal(input.value, String(limite));
    input.value = ''; input.disparar('input'); assert.equal(input.value, '');
    input.value = '1e9'; input.disparar('input'); assert.equal(input.value, '');
    input.value = '12.5'; input.disparar('input'); assert.equal(input.value, '');
}
console.log('PASS: telefone fixo/celular e limites 120/600 em digitação, colagem e edição.');
