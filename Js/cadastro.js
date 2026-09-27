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

        if (senha.length < 8) {
            erroCadastro.innerText = 'A senha deve ter no mínimo 8 caracteres.';
            erroCadastro.style.display = 'block';
            return;
        }

        // Monta objeto do usuário (armazenamento local para este protótipo)
        const usuario = {
            nome,
            email: email.toLowerCase(),
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
            email: email.toLowerCase(),
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
