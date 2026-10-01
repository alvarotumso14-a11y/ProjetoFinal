const formReativacao = document.getElementById('formReativacao');
const emailReativacao = document.getElementById('email');
const erroReativacao = document.getElementById('erroReativacao');
emailReativacao.value = sessionStorage.getItem('emailReativacao') || '';
formReativacao.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formReativacao.reportValidity()) return;
    const botao = formReativacao.querySelector('button[type="submit"]');
    if (botao.disabled) return;
    botao.disabled = true;
    botao.textContent = 'Reativando...';
    erroReativacao.style.display = 'none';
    const dto = { email: emailReativacao.value.trim().toLowerCase(), senha: document.getElementById('senha').value };
    try {
        await UsuarioApi.reativar(dto);
        sessionStorage.removeItem('emailReativacao');
    } catch (erro) {
        erroReativacao.textContent = erro.message;
        erroReativacao.style.display = 'block';
        botao.disabled = false;
        botao.textContent = 'Reativar conta';
        return;
    }
    try {
        salvarSessao(await UsuarioApi.login(dto));
        window.location.href = 'dashboard.html';
    } catch {
        sessionStorage.setItem('avisoLogin', 'Conta reativada. Entre com seu e-mail e senha.');
        window.location.href = 'login.html';
    }
});