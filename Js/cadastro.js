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
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        // Validações básicas
        if (!nome || !email || !senha || !confirmarSenha) {
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
            tipoDiabetes: '',
            idade: '',
            // Atenção: em produção, não armazenar senha em texto limpo.
            senha,
            fatorSensibilidade: '',
            hgtAlvo: '',
            onboardingConcluido: false,
            criadoEm: new Date().toISOString()
        };

        const profile = {
            nome,
            tipo: '',
            idade: '',
            email,
            celular: '',
            photo: '',
            fatorSensibilidade: '',
            hgtAlvo: ''
        };

        // Salva como usuário atual e também no perfil para reutilização em todas as telas
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('profile', JSON.stringify(profile));

        // A configuração de saúde acontece na primeira tela após o cadastro.
        window.location.href = 'configuracao-inicial.html';
    });
} else {
    // Form não encontrado — nada a fazer
}
