const formLogin = document.getElementById("formLogin");
const erroLogin = document.getElementById("erroLogin");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const lembrarMe = document.getElementById("lembrarMe");

const avisoLogin = sessionStorage.getItem("avisoLogin");
if (avisoLogin) {
    const aviso = document.createElement("p");
    aviso.className = "auth-subtitle"; aviso.setAttribute("role", "status"); aviso.textContent = avisoLogin;
    formLogin.before(aviso); sessionStorage.removeItem("avisoLogin");
}

// Já logado: vai direto para o painel.
if (estaLogado()) {
    window.location.replace("dashboard.html");
}

if (formLogin && erroLogin && campoEmail && campoSenha && lembrarMe) {
    campoEmail.value = localStorage.getItem("emailLembrado") || "";
    lembrarMe.checked = campoEmail.value !== "";

    formLogin.addEventListener("submit", async (event) => {
        event.preventDefault();
        esconderErro();

        if (!formLogin.reportValidity()) {
            return;
        }

        const email = campoEmail.value.trim().toLowerCase();
        const senha = campoSenha.value;
        const botao = formLogin.querySelector("button[type='submit']");
        const textoOriginal = botao.textContent;

        botao.disabled = true;
        botao.textContent = "Entrando...";
        // O servidor gratuito "dorme" sem uso; o primeiro acesso pode levar até 1 minuto.
        const aviso = setTimeout(() => { botao.textContent = "Acordando o servidor..."; }, 4000);

        try {
            const resposta = await UsuarioApi.login({ email, senha });
            salvarSessao(resposta);

            if (lembrarMe.checked) {
                localStorage.setItem("emailLembrado", email);
            } else {
                localStorage.removeItem("emailLembrado");
            }

            window.location.href = "dashboard.html";
        } catch (erro) {
            mostrarErro(erro.message || "E-mail ou senha inválidos.");
            botao.disabled = false;
            botao.textContent = textoOriginal;
        } finally {
            clearTimeout(aviso);
        }
    });
}

function mostrarErro(mensagem) {
    erroLogin.textContent = mensagem;
    erroLogin.style.display = "block";
}

function esconderErro() {
    erroLogin.textContent = "";
    erroLogin.style.display = "none";
}

const cadastroEmAndamento = JSON.parse(sessionStorage.getItem("cadastroPendente") || "null");
if (cadastroEmAndamento?.tentativaId) {
    const retomar = document.createElement("a");
    retomar.href = "confirmar-email.html"; retomar.className = "auth-link";
    retomar.textContent = "Continuar confirmação do cadastro nesta aba";
    document.querySelector(".auth-footer-text").append(document.createElement("br"), retomar);
}
