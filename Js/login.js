const formLogin = document.getElementById("formLogin");
const erroLogin = document.getElementById("erroLogin");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const lembrarMe = document.getElementById("lembrarMe");

if (formLogin && erroLogin && campoEmail && campoSenha && lembrarMe) {
    campoEmail.value = localStorage.getItem("emailLembrado") || "";
    lembrarMe.checked = campoEmail.value !== "";

    formLogin.addEventListener("submit", (event) => {
        event.preventDefault();
        erroLogin.textContent = "";
        erroLogin.style.display = "none";

        if (!formLogin.reportValidity()) {
            return;
        }

        const email = campoEmail.value.trim().toLowerCase();
        const senha = campoSenha.value;
        const dadosSalvos = localStorage.getItem("usuario");

        if (!dadosSalvos) {
            mostrarErro("E-mail ou senha inválidos.");
            return;
        }

        let usuario;
        try {
            usuario = JSON.parse(dadosSalvos);
        } catch (erro) {
            console.error("Não foi possível ler os dados da conta salvos neste navegador.", erro);
            mostrarErro("Não foi possível ler os dados da conta. Tente criar a conta novamente.");
            return;
        }

        if (
            !usuario ||
            typeof usuario !== "object" ||
            typeof usuario.email !== "string" ||
            typeof usuario.senha !== "string" ||
            usuario.email.trim().toLowerCase() !== email ||
            usuario.senha !== senha
        ) {
            mostrarErro("E-mail ou senha inválidos.");
            return;
        }

        const usuarioId = usuario.id || Date.now();
        usuario.id = usuarioId;
        localStorage.setItem("usuario", JSON.stringify(usuario));
        localStorage.setItem("usuarioId", String(usuarioId));

        const profile = JSON.parse(localStorage.getItem("profile") || "{}");
        Object.assign(profile, {
            nome: usuario.nome || usuario.name || profile.nome || "",
            tipo: usuario.tipoDiabetes || profile.tipo || "",
            idade: usuario.idade || profile.idade || "",
            email: usuario.email,
            celular: usuario.celular || profile.celular || "",
            fatorSensibilidade: usuario.fatorSensibilidade || profile.fatorSensibilidade || "",
            hgtAlvo: usuario.hgtAlvo || profile.hgtAlvo || ""
        });
        localStorage.setItem("profile", JSON.stringify(profile));

        if (lembrarMe.checked) {
            localStorage.setItem("emailLembrado", email);
        } else {
            localStorage.removeItem("emailLembrado");
        }

        window.location.href = usuario.onboardingConcluido ? "dashboard.html" : "configuracao-inicial.html";
    });
}

function mostrarErro(mensagem) {
    erroLogin.textContent = mensagem;
    erroLogin.style.display = "block";
}
