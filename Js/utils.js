// ============================================================
// utils.js — Funções compartilhadas de autenticação
// Carregue este arquivo ANTES de api.js e dos outros scripts
// de página, em qualquer HTML que precise saber se o usuário
// está logado.
// ============================================================

// Redireciona para o login se não houver usuário logado.
// Chame no topo de páginas protegidas (dashboard, histórico, perfil, calculadora).
function protegerPagina() {
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Retorna o id do usuário logado (número) ou null se não estiver logado.
function getUsuarioIdLogado() {
    const id = localStorage.getItem("usuarioId");
    return id ? Number(id) : null;
}

// Limpa os dados da sessão e volta para a tela de login.
function fazerLogout() {
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("profile");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

// Guarda os dados do usuário autenticado (chamado pelo login.js e cadastro.js)
function salvarSessaoUsuario(usuario) {
    localStorage.setItem("usuarioId", String(usuario.id));
    localStorage.setItem("profile", JSON.stringify({
        nome: usuario.name,
        tipo: usuario.tipoDiabetes,
        idade: usuario.idade ?? "",
        email: usuario.email,
        celular: usuario.celular ?? "",
        fatorSensibilidade: usuario.fatorSensibilidade,
        hgtAlvo: usuario.hgtAlvo
    }));
}
