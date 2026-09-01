// Script simples para processar o formulário de cadastro e salvar as configurações do usuário
const form = document.getElementById('formCadastro');
const erroCadastro = document.getElementById('erroCadastro');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        erroCadastro.style.display = 'none';
        erroCadastro.innerText = '';

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const tipoDiabetes = document.getElementById('tipoDiabetes').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        const fatorSensibilidade = document.getElementById('fatorSensibilidade').value;
        const qtdGramas = document.getElementById('qtdGramas').value;

        // Validações básicas
        if (!nome || !email || !tipoDiabetes || !senha || !confirmarSenha || !fatorSensibilidade || !qtdGramas) {
            erroCadastro.innerText = 'Preencha todos os campos.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (senha !== confirmarSenha) {
            erroCadastro.innerText = 'As senhas não coincidem.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (senha.length < 8) {
            erroCadastro.innerText = 'A senha deve ter no mínimo 8 caracteres.';
            erroCadastro.style.display = 'block';
            return;
        }

        // Monta objeto do usuário (armazenamento local para este protótipo)
        const usuario = {
            nome,
            email,
            tipoDiabetes,
            // Atenção: em produção, não armazenar senha em texto limpo.
            senha,
            fatorSensibilidade: Number(fatorSensibilidade),
            qtdGramas: Number(qtdGramas),
            criadoEm: new Date().toISOString()
        };

        // Salva como usuário atual
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Redireciona para o dashboard
        window.location.href = 'dashboard.html';
    });
} else {
    // Form não encontrado — nada a fazer
}
