// ============================================================
// api.js — Ponto único de comunicação com o backend (ASP.NET)
// ============================================================
//
// COMO CONFIGURAR A URL DO BACKEND:
// Abra o launchSettings.json do seu projeto (Presentation/Properties/launchSettings.json)
// e veja o campo "applicationUrl" do perfil que você usa pra rodar (http ou https).
//
// Exemplo típico:
//   "http":  "applicationUrl": "http://localhost:5288"
//   "https": "applicationUrl": "https://localhost:7130;http://localhost:5288"
//
// Repare que o perfil "https" sobe as DUAS portas ao mesmo tempo — por isso é seguro
// usar sempre a porta HTTP (5288) aqui, mesmo rodando o projeto com o perfil https.
// Isso evita erro de certificado autoassinado no fetch (comum em localhost).
const API_BASE_URL = "https://localhost:7130/api";

// ------------------------------------------------------------
// Função genérica que faz a chamada e já trata erros comuns.
// Todas as outras funções abaixo usam essa por baixo dos panos.
// ------------------------------------------------------------
async function apiFetch(caminho, opcoes = {}) {
    let resposta;
    try {
        resposta = await fetch(`${API_BASE_URL}${caminho}`, {
            headers: {
                "Content-Type": "application/json",
                ...(opcoes.headers || {})
            },
            ...opcoes
        });
    } catch (erroDeRede) {
        // Isso cai aqui quando o backend está desligado, a porta está errada,
        // ou o CORS bloqueou a chamada — o fetch nem chega a ter resposta.
        console.error("Erro de rede ao chamar a API:", erroDeRede);
        throw new Error(
            `Não foi possível conectar ao backend em ${API_BASE_URL}. ` +
            `Confira se ele está rodando e se a porta está correta.`
        );
    }

    if (!resposta.ok) {
        let mensagem = `Erro HTTP ${resposta.status}`;
        try {
            const corpoErro = await resposta.json();
            mensagem = corpoErro.title || corpoErro.message || mensagem;
        } catch {
            // corpo não era JSON, mantém a mensagem padrão
        }
        throw new Error(mensagem);
    }

    // Respostas 204 (No Content) não têm corpo — não tenta fazer .json()
    if (resposta.status === 204) {
        return null;
    }

    return resposta.json();
}

// ------------------------------------------------------------
// USUÁRIOS  (/api/usuario)
// Rotas reais do UsuarioControllers.cs:
//   POST   /api/usuario            -> Create
//   POST   /api/usuario/login      -> Login
//   GET    /api/usuario/{id}       -> GetById
//   GET    /api/usuario            -> GetAll
//   PUT    /api/usuario/{id}       -> Update
//   DELETE /api/usuario/{id}       -> Delete
// ------------------------------------------------------------
const UsuarioApi = {
    login(dto) {
        // dto: { email, senha }
        return apiFetch("/usuario/login", {
            method: "POST",
            body: JSON.stringify(dto)
        });
    },

    criar(dto) {
        // dto: { name, email, senha, tipoDiabetes, idade, celular, fatorSensibilidade, hgtAlvo }
        return apiFetch("/usuario", {
            method: "POST",
            body: JSON.stringify(dto)
        });
    },

    buscarPorId(id) {
        return apiFetch(`/usuario/${id}`);
    },

    listarTodos() {
        return apiFetch("/usuario");
    },

    atualizar(id, dto) {
        return apiFetch(`/usuario/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });
    },

    excluir(id) {
        return apiFetch(`/usuario/${id}`, {
            method: "DELETE"
        });
    }
};

// ------------------------------------------------------------
// REGISTROS DE GLICEMIA  (/api/registros-glicemia)
// Rotas reais do RegistroGlicemiaController.cs:
//   POST   /api/registros-glicemia          -> Create
//   GET    /api/registros-glicemia/{id}     -> GetById
//   GET    /api/registros-glicemia          -> GetAll
//   PUT    /api/registros-glicemia?id=      -> Update (SEM {id} na rota — o id vem por query string mesmo, de propósito)
//   DELETE /api/registros-glicemia?id=      -> Delete (idem)
// ------------------------------------------------------------
const RegistroApi = {
    criar(dto) {
        // dto: { glicemia, dose, hora, refeicao, data, usuarioId }
        return apiFetch("/registros-glicemia", {
            method: "POST",
            body: JSON.stringify(dto)
        });
    },

    buscarPorId(id) {
        return apiFetch(`/registros-glicemia/${id}`);
    },

    listarTodos() {
        return apiFetch("/registros-glicemia");
    },

    atualizar(id, dto) {
        return apiFetch(`/registros-glicemia?id=${id}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });
    },

    excluir(id) {
        return apiFetch(`/registros-glicemia?id=${id}`, {
            method: "DELETE"
        });
    }
};
