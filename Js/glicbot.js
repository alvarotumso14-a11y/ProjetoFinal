document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMensagens = document.getElementById("chatMensagens");
    const chatSugestoes = document.getElementById("chatSugestoes");

    if (!chatForm || !chatInput || !chatMensagens) {
        return;
    }

    // ENDPOINT DO BACKEND: nunca chame a API do LLM direto daqui. A chave de API
    // ficaria visível pra qualquer pessoa no DevTools do navegador. Este endpoint
    // aponta pro servidor proxy (ver pasta server/) que guarda a chave em segredo.
    // Troque para a URL de produção quando o proxy estiver hospedado.
    const GLICBOT_API_URL = "https://tiabete-server.onrender.com/api/glicbot";

    // SEGURANÇA: a base de conhecimento (FAQ) mora só no server.js agora, nunca
    // aqui. Antes, este arquivo montava o "contexto" e mandava pro servidor —
    // isso permitia que qualquer pessoa com o DevTools aberto substituísse o
    // conteúdo confiável por qualquer texto. O cliente manda só a pergunta;
    // quem decide o contexto é o servidor.

    function adicionarMensagem(texto, autor) {
        const bolha = document.createElement("div");
        bolha.className = `msg ${autor}`;
        bolha.textContent = texto;
        chatMensagens.appendChild(bolha);
        chatMensagens.scrollTop = chatMensagens.scrollHeight;
        return bolha;
    }

    // MÉTRICA/LOG — ainda sem backend de analytics, então registramos localmente
    // (console + localStorage) pra não perder visibilidade do uso desde o início.
    function registrarLog(entrada) {
        console.log("[GlicBot]", entrada);

        const logs = JSON.parse(localStorage.getItem("glicbotLogs")) || [];
        logs.push({ ...entrada, quando: new Date().toISOString() });

        while (logs.length > 50) {
            logs.shift();
        }

        localStorage.setItem("glicbotLogs", JSON.stringify(logs));
    }

    async function perguntarAoGlicBot(pergunta) {
        const inicio = performance.now();

        // TIMEOUT: se o servidor (ou a NVIDIA) travar por qualquer motivo, cancela
        // a chamada em 25s em vez de deixar "Digitando..." preso pra sempre.
        const controlador = new AbortController();
        const limiteTempo = setTimeout(() => controlador.abort(), 25000);

        let resposta;
        try {
            resposta = await fetch(GLICBOT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pergunta }),
                signal: controlador.signal,
            });
        } catch (erro) {
            if (erro.name === "AbortError") {
                throw new Error("O servidor demorou demais pra responder (timeout de 25s)");
            }
            throw erro;
        } finally {
            clearTimeout(limiteTempo);
        }

        if (!resposta.ok) {
            throw new Error(`Servidor respondeu ${resposta.status}`);
        }

        const dados = await resposta.json();
        const duracaoMs = Math.round(performance.now() - inicio);
        registrarLog({ pergunta, sucesso: true, duracaoMs });

        return dados.resposta;
    }

    async function enviarPergunta(pergunta) {
        adicionarMensagem(pergunta, "usuario");
        chatInput.value = "";

        const bolhaCarregando = adicionarMensagem("Digitando...", "bot");

        try {
            const respostaTexto = await perguntarAoGlicBot(pergunta);
            bolhaCarregando.textContent = respostaTexto;
        } catch (erro) {
            registrarLog({ pergunta, sucesso: false, erro: erro.message });
            bolhaCarregando.textContent =
                "Não consegui falar com o servidor do GlicBot agora. Tente novamente em instantes.";
        }
    }

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const pergunta = chatInput.value.trim();
        if (!pergunta) {
            return;
        }
        enviarPergunta(pergunta);
    });

    chatSugestoes?.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            const pergunta = chip.dataset.msg;
            if (pergunta) {
                enviarPergunta(pergunta);
            }
        });
    });
});
