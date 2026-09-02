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
        const hgtAlvo = document.getElementById('hgtAlvo').value;

        // Validações básicas
        if (!nome || !email || !tipoDiabetes || !senha || !confirmarSenha || !fatorSensibilidade || !hgtAlvo) {
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
            hgtAlvo: Number(hgtAlvo),
            criadoEm: new Date().toISOString()
        };

        const profile = {
            nome,
            tipo: tipoDiabetes,
            idade: '',
            email,
            celular: '',
            photo: '',
            fatorSensibilidade: Number(fatorSensibilidade),
            hgtAlvo: Number(hgtAlvo)
        };

        // Salva como usuário atual e também no perfil para reutilização em todas as telas
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('profile', JSON.stringify(profile));

        // Redireciona para o dashboard
        window.location.href = 'dashboard.html';
    });
} else {
    // Form não encontrado — nada a fazer
}
