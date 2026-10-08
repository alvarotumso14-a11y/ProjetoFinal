(() => {
    const formSolicitar = document.getElementById("formSolicitarCodigo");
    const formRedefinir = document.getElementById("formRedefinirSenha");
    const campoEmail = document.getElementById("emailRecuperacao");
    const campoCodigo = document.getElementById("codigoRecuperacao");
    const campoSenha = document.getElementById("novaSenha");
    const campoConfirmacao = document.getElementById("confirmarNovaSenha");
    const erro = document.getElementById("erroRecuperacao");
    const aviso = document.getElementById("avisoRecuperacao");
    const descricao = document.getElementById("descricaoRecuperacao");
    const botaoReenviar = document.getElementById("reenviarCodigoRecuperacao");
    const intervaloReenvioSegundos = 60;

    if (!formSolicitar || !formRedefinir || !campoEmail || !campoCodigo || !campoSenha || !campoConfirmacao) return;

    let emailSolicitado = "";
    let reenviarTimer;

    function limparMensagens() {
        erro.textContent = "";
        erro.hidden = true;
        aviso.textContent = "";
        aviso.hidden = true;
    }

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
        erro.hidden = false;
    }

    function mostrarAviso(mensagem) {
        aviso.textContent = mensagem;
        aviso.hidden = false;
    }

    async function solicitarCodigo(botao) {
        limparMensagens();
        const email = campoEmail.value.trim().toLowerCase();
        if (!campoEmail.checkValidity() || !email) {
            mostrarErro("Informe um endereço de e-mail válido.");
            campoEmail.focus();
            return;
        }

        const textoOriginal = botao.textContent;
        botao.disabled = true;
        botao.textContent = "Enviando...";
        try {
            await UsuarioApi.solicitarRecuperacaoSenha(email);
            emailSolicitado = email;
            formSolicitar.hidden = true;
            formRedefinir.hidden = false;
            descricao.textContent = "Se houver uma conta para este e-mail, enviaremos um código. Confira também a caixa de spam.";
            mostrarAviso("Se houver uma conta para este e-mail, enviaremos um código de recuperação.");
            campoCodigo.focus();
            iniciarEsperaReenvio();
        } catch (falha) {
            mostrarErro(falha.message || "Não foi possível solicitar o código. Tente novamente.");
        } finally {
            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    }

    function iniciarEsperaReenvio() {
        let segundos = intervaloReenvioSegundos;
        botaoReenviar.disabled = true;
        botaoReenviar.textContent = `Aguarde ${segundos}s para reenviar`;
        clearInterval(reenviarTimer);
        reenviarTimer = setInterval(() => {
            segundos -= 1;
            if (segundos <= 0) {
                clearInterval(reenviarTimer);
                botaoReenviar.disabled = false;
                botaoReenviar.textContent = "Enviar outro código";
                return;
            }
            botaoReenviar.textContent = `Aguarde ${segundos}s para reenviar`;
        }, 1000);
    }

    formSolicitar.addEventListener("submit", (evento) => {
        evento.preventDefault();
        solicitarCodigo(formSolicitar.querySelector('button[type="submit"]'));
    });

    campoCodigo.addEventListener("input", () => {
        campoCodigo.value = campoCodigo.value.replace(/\D/g, "").slice(0, 6);
    });

    formRedefinir.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        limparMensagens();
        const codigo = campoCodigo.value.trim();
        const senha = campoSenha.value;
        const confirmacao = campoConfirmacao.value;

        if (!/^\d{6}$/.test(codigo)) {
            mostrarErro("Digite os seis números do código enviado ao seu e-mail.");
            campoCodigo.focus();
            return;
        }
        if (senha.length < 8 || senha.length > 64 || new TextEncoder().encode(senha).length > 72) {
            mostrarErro("A senha deve ter entre 8 e 64 caracteres e até 72 bytes.");
            campoSenha.focus();
            return;
        }
        if (senha !== confirmacao) {
            mostrarErro("As senhas não coincidem.");
            campoConfirmacao.focus();
            return;
        }

        const botao = formRedefinir.querySelector('button[type="submit"]');
        botao.disabled = true;
        botao.textContent = "Alterando senha...";
        try {
            await UsuarioApi.redefinirSenha({ email: emailSolicitado, codigo, novaSenha: senha });
            formRedefinir.hidden = true;
            descricao.textContent = "Sua senha foi alterada. Entre com a nova senha.";
            mostrarAviso("Senha alterada com sucesso.");
            window.setTimeout(() => { window.location.href = "login.html"; }, 1800);
        } catch (falha) {
            mostrarErro(falha.message || "Não foi possível alterar a senha. Verifique o código e tente novamente.");
            botao.disabled = false;
            botao.textContent = "Alterar senha";
        }
    });

    botaoReenviar.addEventListener("click", () => {
        if (!botaoReenviar.disabled) solicitarCodigo(botaoReenviar);
    });
})();
