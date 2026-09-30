document.documentElement.dataset.theme = localStorage.getItem('tema') === 'escuro'
    ? 'dark'
    : 'light';

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle-float';
    themeToggle.type = 'button';
    themeToggle.setAttribute('aria-pressed', 'false');
    document.body.appendChild(themeToggle);

    function atualizarBotaoTema() {
        const modoEscuroAtivo = document.documentElement.dataset.theme === 'dark';
        themeToggle.setAttribute('aria-pressed', String(modoEscuroAtivo));
        themeToggle.setAttribute('aria-label', modoEscuroAtivo ? 'Ativar modo claro' : 'Ativar modo escuro');
        themeToggle.title = modoEscuroAtivo ? 'Ativar modo claro' : 'Ativar modo escuro';
        themeToggle.innerHTML = modoEscuroAtivo
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path></svg>';
    }

    atualizarBotaoTema();
    themeToggle.addEventListener('click', () => {
        const modoEscuroAtivo = document.documentElement.dataset.theme !== 'dark';
        document.documentElement.dataset.theme = modoEscuroAtivo ? 'dark' : 'light';
        localStorage.setItem('tema', modoEscuroAtivo ? 'escuro' : 'claro');
        atualizarBotaoTema();
    });
});
