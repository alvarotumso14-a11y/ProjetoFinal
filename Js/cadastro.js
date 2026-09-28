// Script simples para processar o formulário de cadastro e salvar as configurações do usuário
const form = document.getElementById('formCadastro');
const erroCadastro = document.getElementById('erroCadastro');
const botoesVisibilidade = document.querySelectorAll('.password-visibility');

botoesVisibilidade.forEach((botao) => {
    const campo = document.getElementById(botao.dataset.target);
    if (!campo) return;

    const ocultarSenha = () => {
        campo.type = 'password';
        botao.setAttribute('aria-label', 'Segure para mostrar senha');
        botao.setAttribute('aria-pressed', 'false');
    };

    const mostrarSenha = () => {
        campo.type = 'text';
        botao.setAttribute('aria-label', 'Solte para ocultar senha');
        botao.setAttribute('aria-pressed', 'true');
    };

    botao.addEventListener('pointerdown', (evento) => {
        evento.preventDefault();
        mostrarSenha();
        botao.setPointerCapture(evento.pointerId);
    });
    botao.addEventListener('pointerup', ocultarSenha);
    botao.addEventListener('pointercancel', ocultarSenha);
    botao.addEventListener('lostpointercapture', ocultarSenha);
    botao.addEventListener('pointerleave', ocultarSenha);
    botao.addEventListener('keydown', (evento) => {
        if (evento.key === ' ' || evento.key === 'Enter') {
            evento.preventDefault();
            mostrarSenha();
        }
    });
    botao.addEventListener('keyup', (evento) => {
        if (evento.key === ' ' || evento.key === 'Enter') ocultarSenha();
    });
    botao.addEventListener('blur', ocultarSenha);
});

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        erroCadastro.style.display = 'none';
        erroCadastro.innerText = '';

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const emailValido = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/.test(email)
            && document.getElementById('email').checkValidity();
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        // Validações básicas
        if (!nome || !email || !senha || !confirmarSenha) {
            erroCadastro.innerText = 'Preencha todos os campos.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (!emailValido) {
            erroCadastro.innerText = 'Informe um e-mail válido.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (senha !== confirmarSenha) {
            erroCadastro.innerText = 'As senhas não coincidem.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (!document.getElementById('aceitouTermos')?.checked) {
            erroCadastro.innerText = 'Para criar a conta, leia e aceite os Termos de Uso e a Política de Privacidade.';
            erroCadastro.style.display = 'block';
            return;
        }

        if (!document.getElementById('consentimentoSaude')?.checked) {
            erroCadastro.innerText = 'O GlicHelp precisa da sua autorização para guardar dados de saúde (glicemia e insulina).';
            erroCadastro.style.display = 'block';
            return;
        }

        if (senha.length < 8) {
            erroCadastro.innerText = 'A senha deve ter no mínimo 8 caracteres.';
            erroCadastro.style.display = 'block';
            return;
        }

        // A conta só é criada na API depois da configuração inicial (tipo de diabetes,
        // fator de sensibilidade e HGT alvo são obrigatórios no back-end).
        // Até lá, os dados ficam só nesta aba (sessionStorage some ao fechar a aba).
        sessionStorage.setItem('cadastroPendente', JSON.stringify({
            nome,
            email: email.toLowerCase(),
            senha,
            aceitouTermos: true,
            consentiuDadosSaude: true
        }));

        window.location.href = 'configuracao-inicial.html';
    });
} else {
    // Form não encontrado — nada a fazer
}
