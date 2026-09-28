// Confirmação de e-mail: a pessoa digita o código de 6 números recebido por e-mail.
const pendente = JSON.parse(sessionStorage.getItem("cadastroPendente") || "null");

if (!pendente || !pendente.email) {
    window.location.replace("login.html");
}

const form = document.getElementById("formConfirmacao");
const campoCodigo = document.getElementById("codigo");
const erro = document.getElementById("erroConfirmacao");
const aviso = document.getElementById("avisoConfirmacao");
const linkReenviar = document.getElementById("reenviarCodigo");

document.getElementById("emailDestino").textContent = pendente?.email || "seu e-mail";
campoCodigo.focus();

// Só números, no máximo 6
campoCodigo.addEventListener("input", () => {
    campoCodigo.value = campoCodigo.value.replace(/\D/g, "").slice(0, 6);
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    esconderMensagens();

    const codigo = campoCodigo.value.trim();
    if (!/^\d{6}$/.test(codigo)) {
        mostrarErro("Digite os 6 números do código.");
        return;
    }

    const botao = form.querySelector("button[type='submit']");
    botao.disabled = true;
    botao.textContent = "Confirmando...";

    try {
        await UsuarioApi.confirmarEmail({ email: pendente.email, codigo });

        // E-mail confirmado: entra direto com os dados informados no cadastro/login.
        const resposta = await UsuarioApi.login({ email: pendente.email, senha: pendente.senha });
        sessionStorage.removeItem("cadastroPendente");
        salvarSessao(resposta);
        window.location.href = "dashboard.html";
    } catch (e) {
        mostrarErro(e.message);
        botao.disabled = false;
        botao.textContent = "Confirmar";
    }
});

linkReenviar.addEventListener("click", async (event) => {
    event.preventDefault();
    esconderMensagens();
    linkReenviar.style.pointerEvents = "none";

    try {
        await UsuarioApi.reenviarCodigo(pendente.email);
        aviso.textContent = "Novo código enviado. O código anterior deixou de valer.";
        aviso.style.display = "block";
        campoCodigo.value = "";
        campoCodigo.focus();
    } catch (e) {
        mostrarErro(e.message);
    } finally {
        // Evita cliques repetidos (a API também limita a 5 por minuto)
        setTimeout(() => { linkReenviar.style.pointerEvents = ""; }, 30000);
    }
});

function mostrarErro(mensagem) {
    erro.textContent = mensagem;
    erro.style.display = "block";
}

function esconderMensagens() {
    erro.style.display = "none";
    aviso.style.display = "none";
}
