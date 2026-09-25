document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const profile = JSON.parse(localStorage.getItem("profile") || "null");
    const nome = usuario?.nome || profile?.nome || "seja bem-vindo";
    const nomeBoasVindas = document.getElementById("nomeBoasVindas");
    const boasVindas = document.getElementById("boasVindas");
    const configuracao = document.getElementById("configuracao");
    const form = document.getElementById("formConfiguracao");
    const erro = document.getElementById("erroConfiguracao");

    nomeBoasVindas.textContent = nome.split(" ")[0];

    document.getElementById("iniciarConfiguracao").addEventListener("click", () => {
        boasVindas.hidden = true;
        configuracao.hidden = false;
        document.getElementById("idadeInicial").focus();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        erro.hidden = true;

        const idade = document.getElementById("idadeInicial").value;
        const tipoDiabetes = document.getElementById("tipoDiabetesInicial").value;
        const fatorSensibilidade = document.getElementById("fatorSensibilidadeInicial").value;
        const hgtAlvo = document.getElementById("hgtAlvoInicial").value;

        if (!idade || Number(idade) < 1 || Number(idade) > 120 || !tipoDiabetes || !fatorSensibilidade || !hgtAlvo) {
            erro.textContent = "Preencha todos os campos com valores válidos para continuar.";
            erro.hidden = false;
            return;
        }

        const dados = {
            idade,
            idadeInicial: Number(idade),
            tipoDiabetes,
            fatorSensibilidade: Number(fatorSensibilidade),
            hgtAlvo: Number(hgtAlvo),
            idadeDataReferencia: new Date().toISOString()
        };

        const usuarioAtual = usuario || {};
        Object.assign(usuarioAtual, dados, { onboardingConcluido: true });
        localStorage.setItem("usuario", JSON.stringify(usuarioAtual));

        const profileAtual = profile || {};
        Object.assign(profileAtual, {
            nome,
            idade,
            tipo: tipoDiabetes,
            fatorSensibilidade: dados.fatorSensibilidade,
            hgtAlvo: dados.hgtAlvo
        });
        localStorage.setItem("profile", JSON.stringify(profileAtual));
        window.location.href = "dashboard.html";
    });
});
