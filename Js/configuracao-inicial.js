document.addEventListener("DOMContentLoaded", () => {
    const pendente = JSON.parse(sessionStorage.getItem("cadastroPendente") || "null");

    // Sem cadastro em andamento: volta para o início do fluxo.
    if (!pendente) {
        window.location.replace(estaLogado() ? "dashboard.html" : "cadastro.html");
        return;
    }

    const nomeBoasVindas = document.getElementById("nomeBoasVindas");
    const boasVindas = document.getElementById("boasVindas");
    const configuracao = document.getElementById("configuracao");
    const form = document.getElementById("formConfiguracao");
    const erro = document.getElementById("erroConfiguracao");

    nomeBoasVindas.textContent = pendente.nome.split(" ")[0];

    // Menor de 18: mostra os campos do responsável legal (LGPD art. 14)
    const campoIdade = document.getElementById("idadeInicial");
    const blocoResponsavel = document.getElementById("blocoResponsavel");
    FormInputs.limitarInteiro(campoIdade, 120, document.getElementById("idadeInicialWarning"));
    campoIdade.addEventListener("input", () => {

        const idade = Number(campoIdade.value);
        blocoResponsavel.hidden = !(idade >= 1 && idade < 18);
    });

    [
        ["fatorSensibilidadeInicial", "fatorSensibilidadeInicialWarning"],
        ["hgtAlvoInicial", "hgtAlvoInicialWarning"]
    ].forEach(([id, avisoId]) => {
        const campo = document.getElementById(id);
        FormInputs.limitarNumero(campo, 501, document.getElementById(avisoId));
    });

    document.getElementById("iniciarConfiguracao").addEventListener("click", () => {
        boasVindas.hidden = true;
        configuracao.hidden = false;
        document.getElementById("idadeInicial").focus();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        erro.hidden = true;

        const idade = Number(document.getElementById("idadeInicial").value);
        const tipoDiabetes = document.getElementById("tipoDiabetesInicial").value;
        const fatorSensibilidade = Number(document.getElementById("fatorSensibilidadeInicial").value);
        const hgtAlvo = Number(document.getElementById("hgtAlvoInicial").value);

        if (!Number.isInteger(idade) || idade < 1 || idade > 120 || !tipoDiabetes
            || !Number.isFinite(fatorSensibilidade) || fatorSensibilidade < 1 || fatorSensibilidade > 501
            || !Number.isFinite(hgtAlvo) || hgtAlvo < 1 || hgtAlvo > 501) {
            mostrarErro("Informe idade inteira e valores de fator de sensibilidade e HGT alvo entre 1 e 501.");
            return;
        }

        const menor = idade < 18;
        const responsavelNome = document.getElementById("responsavelNome").value.trim();
        const consentimentoResponsavel = document.getElementById("consentimentoResponsavel").checked;

        if (menor && (!responsavelNome || !consentimentoResponsavel)) {
            mostrarErro("Para menores de 18 anos, informe o nome do responsável legal e marque a autorização.");
            return;
        }

        const botao = form.querySelector("button[type='submit']");
        botao.disabled = true;
        botao.textContent = "Criando sua conta...";

        try {
            const cadastro = await UsuarioApi.criar({
                name: pendente.nome,
                email: pendente.email,
                senha: pendente.senha,
                tipoDiabetes,
                idade,
                celular: pendente.celular || null,
                fatorSensibilidade: fatorSensibilidade,
                hgtAlvo,
                aceitouTermos: pendente.aceitouTermos === true,
                consentiuDadosSaude: pendente.consentiuDadosSaude === true,
                responsavelNome: menor ? responsavelNome : null,
                consentimentoResponsavel: menor ? consentimentoResponsavel : false
            });

            if (!cadastro?.tentativaId) throw new Error("O servidor não retornou a tentativa de cadastro.");
            sessionStorage.setItem("cadastroPendente", JSON.stringify({
                nome: pendente.nome, email: pendente.email, senha: pendente.senha,
                tentativaId: cadastro.tentativaId
            }));
            window.location.href = "confirmar-email.html";
        } catch (e) {
            const jaExiste = /já existe/i.test(e.message);
            mostrarErro(jaExiste
                ? "Este e-mail já tem cadastro. Faça login ou volte e use outro e-mail."
                : e.message);
            botao.disabled = false;
            botao.textContent = "Salvar e confirmar e-mail";
        }
    });

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
        erro.hidden = false;
    }
});
