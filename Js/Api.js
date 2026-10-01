// ============================================================
// Api.js — Ponto único de comunicação com o back-end (ASP.NET)
// Carregue ANTES dos scripts de página em todo HTML que fala com a API.
// ============================================================

// ------------------------------------------------------------
// ENDEREÇO DA API
// - Rodando no seu computador (localhost / arquivo aberto direto): usa a API local.
// - Rodando no site publicado: usa API_PRODUCAO.
// Depois de publicar a API, troque API_PRODUCAO pela URL do Render.
// ------------------------------------------------------------
const API_PRODUCAO = ""; // Configure explicitamente antes de publicar esta copia.
const API_LOCAL = "http://localhost:5388/api";

const API_BASE_URL = (() => {
    const host = window.location.hostname;
    const local = window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1";
    const configurada = window.GLICHELP_API_URL;
    if (configurada) return configurada.replace(/\/$/, "");
    return local ? API_LOCAL : API_PRODUCAO;
})();

// ------------------------------------------------------------
// SESSÃO (token JWT + dados do perfil usados pelas telas)
// ------------------------------------------------------------
const CHAVE_TOKEN = "authToken";

function obterToken() {
    return localStorage.getItem(CHAVE_TOKEN);
}

function estaLogado() {
    return !!obterToken();
}

// Converte o usuário da API para o formato "profile" que as telas já usam.
function salvarPerfilLocal(usuario) {
    const anterior = JSON.parse(localStorage.getItem("profile") || "{}");
    localStorage.setItem("profile", JSON.stringify({
        nome: usuario.name,
        tipo: usuario.tipoDiabetes,
        idade: usuario.idade ?? "",
        email: usuario.email,
        celular: usuario.celular ?? "",
        fatorSensibilidade: usuario.fatorSensibilidade,
        hgtAlvo: usuario.hgtAlvo,
        photo: anterior.email === usuario.email ? (anterior.photo || "") : "" // foto fica só neste navegador
    }));
    localStorage.setItem("usuarioId", String(usuario.id));
}

function salvarSessao(loginResposta) {
    localStorage.setItem(CHAVE_TOKEN, loginResposta.token);
    salvarPerfilLocal(loginResposta.usuario);
}

function limparSessao() {
    sessionStorage.removeItem("alteracaoEmailPendente");
    [CHAVE_TOKEN, "usuarioId", "profile", "usuario", "registros", "ultimoHGT", "ultimoInsulinaEstimada", "glicbotLogs"]
        .forEach((chave) => localStorage.removeItem(chave));
}

function logout() {
    limparSessao();
    window.location.href = "login.html";
}

// Páginas que exigem login: sem token, volta para o login.
(function protegerPaginas() {
    const protegidas = ["dashboard.html", "historico.html", "profile.html", "calculadora.html", "glicbot.html"];
    const pagina = (window.location.pathname.split("/").pop() || "").toLowerCase();
    if (protegidas.includes(pagina) && !estaLogado()) {
        window.location.replace("login.html");
    }
})();

// ------------------------------------------------------------
// Chamada genérica: adiciona o token, trata erros e mensagens da API.
// ------------------------------------------------------------
async function apiFetch(caminho, opcoes = {}) {
    if (!API_BASE_URL) throw new Error("A API deste site ainda não foi configurada.");
    const token = obterToken();
    const headers = { ...(opcoes.headers || {}) };

    if (opcoes.body !== undefined && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let resposta;
    try {
        resposta = await fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, headers });
    } catch (erroDeRede) {
        console.error("Erro de rede ao chamar a API:", erroDeRede);
        throw new Error("Não foi possível conectar ao servidor. Verifique sua internet e tente de novo em instantes.");
    }

    // Token vencido ou conta desativada: encerra a sessão (exceto na própria tela de login).
    if (resposta.status === 401 && token && !caminho.startsWith("/usuario/login")) {
        limparSessao();
        window.location.replace("login.html");
        throw new Error("Sua sessão expirou. Entre novamente.");
    }

    if (!resposta.ok) {
        const erro = new Error(await lerMensagemDeErro(resposta));
        erro.status = resposta.status; // ex.: 403 = e-mail ainda não confirmado
        throw erro;
    }

    if (resposta.status === 204) {
        return null;
    }

    const tipo = resposta.headers.get("Content-Type") || "";
    if (tipo.includes("application/json")) {
        return resposta.json();
    }
    if (tipo.includes("application/pdf")) {
        return resposta.blob();
    }
    return resposta.text();
}

// A API devolve erros como texto simples ("Email ou senha inválidos.")
// ou como ValidationProblemDetails ({ title, errors: { Campo: ["msg"] } }).
async function lerMensagemDeErro(resposta) {
    const texto = await resposta.text();
    if (!texto) {
        return resposta.status === 429
            ? "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."
            : `Erro ${resposta.status} ao falar com o servidor.`;
    }

    try {
        const corpo = JSON.parse(texto);
        if (typeof corpo === "string") return corpo;
        if (corpo.errors) {
            return Object.values(corpo.errors).flat().join(" ");
        }
        return corpo.detail || corpo.title || corpo.mensagem || corpo.message || texto;
    } catch {
        return texto;
    }
}

// Data de hoje no fuso do usuário, no formato da API (yyyy-mm-dd).
function hojeIso() {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${agora.getFullYear()}-${mes}-${dia}`;
}

// ------------------------------------------------------------
// USUÁRIOS  (/api/usuario)
// ------------------------------------------------------------
const UsuarioApi = {
    // dto: { email, senha } -> { token, usuario }
    login(dto) {
        return apiFetch("/usuario/login", { method: "POST", body: JSON.stringify(dto) });
    },

    // dto: { name, email, senha, tipoDiabetes, idade, celular, fatorSensibilidade, hgtAlvo }
    criar(dto) {
        return apiFetch("/usuario", { method: "POST", body: JSON.stringify(dto) });
    },

    perfil() {
        return apiFetch("/usuario/perfil");
    },

    // dto: { email, codigo, tentativaId } — código de 6 dígitos enviado por e-mail
    confirmarEmail(dto) {
        return apiFetch("/usuario/confirmar-email", { method: "POST", body: JSON.stringify(dto) });
    },

    reenviarCodigo(email) {
        return apiFetch("/usuario/reenviar-codigo", { method: "POST", body: JSON.stringify({ email }) });
    },

    // dto parcial: só os campos que mudaram
    atualizarPerfil(dto) {
        return apiFetch("/usuario/perfil", { method: "PATCH", body: JSON.stringify(dto) });
    },

    confirmarNovoEmail(codigo) {
        return apiFetch("/usuario/confirmar-novo-email", { method: "POST", body: JSON.stringify({ codigo }) });
    },

    desativar() {
        return apiFetch("/usuario/perfil", { method: "DELETE" });
    },

    consultarCadastro(email) {
        return apiFetch("/usuario/consultar-cadastro", { method: "POST", body: JSON.stringify({ email }) });
    },

    reativar(dto) {
        return apiFetch("/usuario/reativar", { method: "POST", body: JSON.stringify(dto) });
    }
};

// ------------------------------------------------------------
// REGISTROS DE GLICEMIA  (/api/registro-glicemia)
// ------------------------------------------------------------
const RegistroApi = {
    // O backend atual retorna a lista completa, sem paginação.
    listar() {
        return apiFetch("/registro-glicemia");
    },

    buscarPorId(id) {
        return apiFetch(`/registro-glicemia/${id}`);
    },

    // dto: { glicemia, glicemiaAcimaDoLimite, dose, hora "HH:MM:SS", refeicao, data "yyyy-mm-dd", observacao }
    criar(dto) {
        return apiFetch("/registro-glicemia", { method: "POST", body: JSON.stringify(dto) });
    },

    atualizar(id, dto) {
        return apiFetch(`/registro-glicemia/${id}`, { method: "PUT", body: JSON.stringify(dto) });
    },

    excluir(id) {
        return apiFetch(`/registro-glicemia/${id}`, { method: "DELETE" });
    },

    // Devolve o PDF como Blob
    pdf(dataInicial, dataFinal) {
        return apiFetch(`/registro-glicemia/pdf?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
    }
};

// ------------------------------------------------------------
// Conversão entre o registro da API e o formato usado nas telas
// ------------------------------------------------------------
const REFEICAO_EXIBICAO = {
    "Café da Manhã": "Café da Manhã",
    "Almoço": "Almoço",
    "Lanche": "Lanche",
    "Jantar": "Jantar",
    "Ceia": "Ceia",
    "☕ Café da Manhã": "Café da Manhã",
    "🍛 Almoço": "Almoço",
    "🥪 Lanche": "Lanche",
    "🍽️ Janta": "Jantar",
    "🍽️ Jantar": "Jantar",
    "🌙 Ceia": "Ceia",
    "Outro": "Outro"
};

function registroDaApi(r) {
    const [ano, mes, dia] = String(r.data).split("-");
    return {
        id: r.id,
        glicemia: r.glicemiaAcimaDoLimite ? "HI" : r.glicemia,
        glicemiaAcimaDoLimite: r.glicemiaAcimaDoLimite,
        dose: Number(r.dose) || 0,
        hora: String(r.hora).slice(0, 5),
        refeicao: REFEICAO_EXIBICAO[r.refeicao] || r.refeicao,
        observacao: r.observacao || "",
        data: `${dia}/${mes}/${ano}`,
        dataIso: r.data
    };
}

// Os ícones pertencem à apresentação; a API recebe o nome da refeição.
function refeicaoParaApi(valor) {
    return REFEICAO_EXIBICAO[valor] || valor;
}

function ordenarRegistrosRecentes(registros) {
    return [...registros].sort((a, b) => {
        const dataHoraA = `${a.dataIso || ""}T${a.hora || ""}`;
        const dataHoraB = `${b.dataIso || ""}T${b.hora || ""}`;
        return dataHoraB.localeCompare(dataHoraA);
    });
}
