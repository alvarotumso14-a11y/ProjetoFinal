(() => {
    const alteracao = JSON.parse(sessionStorage.getItem("alteracaoEmailPendente") || "null");
    const cadastro = JSON.parse(sessionStorage.getItem("cadastroPendente") || "null");
    const pendente = alteracao || cadastro;
    if (!pendente?.email || (!alteracao && !cadastro?.tentativaId)) {
        sessionStorage.setItem("avisoLogin", "Retome o cadastro para iniciar uma nova confirmação de e-mail.");
        window.location.replace("login.html");
        return;
    }
    if (alteracao && !estaLogado()) { window.location.replace("login.html"); return; }
    const form = document.getElementById("formConfirmacao");
    const campo = document.getElementById("codigo");
    const erro = document.getElementById("erroConfirmacao");
    const aviso = document.getElementById("avisoConfirmacao");
    const reenviar = document.getElementById("reenviarCodigo");
    const intervaloReenvioSegundos = 60;
    let timerReenvio;
    document.getElementById("emailDestino").textContent = pendente.email;
    const voltar = document.querySelector('a[href="login.html"]');
    if (alteracao) {
        document.querySelector("h1").textContent = "Confirme seu novo e-mail";
        voltar.href = "Profile.html"; voltar.textContent = "Voltar para o perfil";
    }
    campo.focus();
    campo.addEventListener("input", () => { campo.value = campo.value.replace(/\D/g, "").slice(0,6); });
    function limparMensagens() { erro.style.display = "none"; aviso.style.display = "none"; }
    function falhou(e) { erro.textContent = e.message; erro.style.display = "block"; }
    function iniciarEsperaReenvio() {
        let segundos = intervaloReenvioSegundos;
        clearInterval(timerReenvio);
        reenviar.setAttribute("aria-disabled", "true");
        reenviar.style.pointerEvents = "none";
        reenviar.textContent = `Enviar novo código (${segundos}s)`;
        timerReenvio = window.setInterval(() => {
            segundos -= 1;
            if (segundos <= 0) {
                clearInterval(timerReenvio);
                reenviar.removeAttribute("aria-disabled");
                reenviar.style.pointerEvents = "";
                reenviar.textContent = "Enviar novo código";
                return;
            }
            reenviar.textContent = `Enviar novo código (${segundos}s)`;
        }, 1000);
    }
    iniciarEsperaReenvio();
    form.addEventListener("submit", async event => {
        event.preventDefault(); limparMensagens();
        const codigo = campo.value.trim();
        if (!/^\d{6}$/.test(codigo)) { falhou(new Error("Digite os seis números do código.")); return; }
        const botao = form.querySelector('button[type="submit"]');
        botao.disabled = true; botao.textContent = "Confirmando...";
        try {
            if (alteracao) {
                await UsuarioApi.confirmarNovoEmail(codigo);
                sessionStorage.removeItem("alteracaoEmailPendente");
                limparSessao();
                sessionStorage.setItem("avisoLogin", "E-mail atualizado. Entre com o novo endereço.");
                window.location.href = "login.html";
                return;
            }
            await UsuarioApi.confirmarEmail({ email: cadastro.email, codigo, tentativaId: cadastro.tentativaId });
            sessionStorage.removeItem("cadastroPendente");
            try {
                salvarSessao(await UsuarioApi.login({ email: cadastro.email, senha: cadastro.senha }));
                window.location.href = "dashboard.html";
            } catch {
                sessionStorage.setItem("avisoLogin", "E-mail confirmado. Faça login para continuar.");
                window.location.href = "login.html";
            }
        } catch (e) { falhou(e); botao.disabled = false; botao.textContent = "Confirmar"; }
    });
    reenviar.addEventListener("click", async event => {
        event.preventDefault();
        if (reenviar.getAttribute("aria-disabled") === "true") return;
        limparMensagens(); reenviar.setAttribute("aria-disabled", "true"); reenviar.style.pointerEvents = "none";
        iniciarEsperaReenvio();
        try {
            if (alteracao) await UsuarioApi.atualizarPerfil({ email: alteracao.email });
            else await UsuarioApi.reenviarCodigo(cadastro.email);
            aviso.textContent = "Novo código enviado. O anterior deixou de valer."; aviso.style.display = "block";
            campo.value = ""; campo.focus();
        } catch (e) { falhou(e); }
    });
})();
