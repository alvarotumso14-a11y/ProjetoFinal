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

    const preferenciasAcessibilidade = {
        tamanhoFonte: Number(localStorage.getItem('acessibilidade-tamanho-fonte')) || 1,
        altoContraste: localStorage.getItem('acessibilidade-alto-contraste') === 'true',
        focoVisivel: localStorage.getItem('acessibilidade-foco-visivel') === 'true'
    };
    const painelAcessibilidade = document.createElement('section');
    painelAcessibilidade.className = 'painel-acessibilidade';
    painelAcessibilidade.id = 'painelAcessibilidade';
    painelAcessibilidade.setAttribute('aria-label', 'Configurações de acessibilidade');
    painelAcessibilidade.hidden = true;
    painelAcessibilidade.innerHTML = `
        <h2>Acessibilidade</h2>
        <div class="acessibilidade-controle">
            <span>Tamanho da fonte</span>
            <div>
                <button type="button" data-fonte="diminuir" aria-label="Diminuir fonte">A−</button>
                <button type="button" data-fonte="aumentar" aria-label="Aumentar fonte">A+</button>
            </div>
        </div>
        <label class="acessibilidade-opcao">
            <input type="checkbox" id="altoContraste">
            Alto contraste
        </label>
        <label class="acessibilidade-opcao">
            <input type="checkbox" id="focoVisivel">
            Foco visível no teclado
        </label>
        <button class="acessibilidade-leitura" id="leituraEmVozAlta" type="button" aria-pressed="false">
            Ouvir conteúdo
        </button>
        <p class="acessibilidade-ajuda">A leitura em voz alta é um apoio e não substitui um leitor de tela.</p>
    `;

    const accessibilityToggle = document.createElement('button');
    accessibilityToggle.className = 'accessibility-toggle-float';
    accessibilityToggle.type = 'button';
    accessibilityToggle.setAttribute('aria-expanded', 'false');
    accessibilityToggle.setAttribute('aria-controls', painelAcessibilidade.id);
    accessibilityToggle.setAttribute('aria-label', 'Abrir configurações de acessibilidade');
    accessibilityToggle.textContent = 'A';
    document.body.append(painelAcessibilidade, accessibilityToggle);

    const altoContraste = painelAcessibilidade.querySelector('#altoContraste');
    const focoVisivel = painelAcessibilidade.querySelector('#focoVisivel');
    const botaoLeitura = painelAcessibilidade.querySelector('#leituraEmVozAlta');
    let tamanhoFonte = Math.min(1.3, Math.max(0.8, preferenciasAcessibilidade.tamanhoFonte));
    let escalaFonteAplicada = 1;
    let tamanhosOriginais = new WeakMap();
    let leituraAtiva = false;

    function aplicarTamanhoFonte(recalcular = false) {
        const elementos = document.querySelectorAll('body *:not(svg):not(path)');
        if (recalcular) {
            elementos.forEach((elemento) => {
                const tamanhoOriginal = tamanhosOriginais.get(elemento);
                if (!tamanhoOriginal) return;
                if (tamanhoOriginal.estilo) {
                    elemento.style.setProperty('font-size', tamanhoOriginal.estilo, tamanhoOriginal.prioridade);
                } else {
                    elemento.style.removeProperty('font-size');
                }
            });
            tamanhosOriginais = new WeakMap();
            escalaFonteAplicada = 1;
        }

        elementos.forEach((elemento) => {
            let original = tamanhosOriginais.get(elemento);
            if (!original) {
                const tamanhoAtual = parseFloat(getComputedStyle(elemento).fontSize);
                const pai = elemento.parentElement;
                const tamanhoPai = pai ? parseFloat(getComputedStyle(pai).fontSize) : NaN;
                const originalDoPai = pai ? tamanhosOriginais.get(pai) : null;
                const tamanhoBase = pai && Math.abs(tamanhoAtual - tamanhoPai) < 0.05
                    ? (originalDoPai?.tamanho || tamanhoPai / escalaFonteAplicada)
                    : tamanhoAtual;
                original = {
                    tamanho: tamanhoBase,
                    estilo: elemento.style.getPropertyValue('font-size'),
                    prioridade: elemento.style.getPropertyPriority('font-size')
                };
                tamanhosOriginais.set(elemento, original);
            }

            if (tamanhoFonte === 1) {
                if (original.estilo) {
                    elemento.style.setProperty('font-size', original.estilo, original.prioridade);
                } else {
                    elemento.style.removeProperty('font-size');
                }
            } else {
                elemento.style.setProperty('font-size', `${original.tamanho * tamanhoFonte}px`);
            }
        });
        escalaFonteAplicada = tamanhoFonte;
    }

    function aplicarPreferenciasAcessibilidade() {
        aplicarTamanhoFonte();
        document.documentElement.dataset.contrast = preferenciasAcessibilidade.altoContraste ? 'high' : 'normal';
        document.body.classList.toggle('a11y-focus-visible', preferenciasAcessibilidade.focoVisivel);
        altoContraste.checked = preferenciasAcessibilidade.altoContraste;
        focoVisivel.checked = preferenciasAcessibilidade.focoVisivel;
        localStorage.setItem('acessibilidade-tamanho-fonte', String(tamanhoFonte));
        localStorage.setItem('acessibilidade-alto-contraste', String(preferenciasAcessibilidade.altoContraste));
        localStorage.setItem('acessibilidade-foco-visivel', String(preferenciasAcessibilidade.focoVisivel));
    }

    function alternarPainelAcessibilidade(aberto) {
        painelAcessibilidade.hidden = !aberto;
        accessibilityToggle.setAttribute('aria-expanded', String(aberto));
        accessibilityToggle.setAttribute('aria-label', aberto
            ? 'Fechar configurações de acessibilidade'
            : 'Abrir configurações de acessibilidade');
        if (aberto) {
            painelAcessibilidade.querySelector('[data-fonte="aumentar"]').focus();
        } else {
            accessibilityToggle.focus();
        }
    }

    aplicarPreferenciasAcessibilidade();
    const observadorFonte = new MutationObserver(() => {
        aplicarTamanhoFonte();
        window.dispatchEvent(new Event('accessibilityfontsizechange'));
    });
    observadorFonte.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => aplicarTamanhoFonte(true));
    accessibilityToggle.addEventListener('click', () => {
        alternarPainelAcessibilidade(painelAcessibilidade.hidden);
    });
    painelAcessibilidade.addEventListener('click', (event) => {
        const botaoFonte = event.target.closest('[data-fonte]');
        if (botaoFonte) {
            const incremento = botaoFonte.dataset.fonte === 'aumentar' ? 0.1 : -0.1;
            tamanhoFonte = Math.round(Math.min(1.3, Math.max(0.8, tamanhoFonte + incremento)) * 10) / 10;
            aplicarPreferenciasAcessibilidade();
            window.dispatchEvent(new Event('accessibilityfontsizechange'));
        }
    });
    altoContraste.addEventListener('change', () => {
        preferenciasAcessibilidade.altoContraste = altoContraste.checked;
        aplicarPreferenciasAcessibilidade();
    });
    focoVisivel.addEventListener('change', () => {
        preferenciasAcessibilidade.focoVisivel = focoVisivel.checked;
        aplicarPreferenciasAcessibilidade();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !painelAcessibilidade.hidden) {
            alternarPainelAcessibilidade(false);
        }
    });

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
        botaoLeitura.disabled = true;
        botaoLeitura.textContent = 'Leitura em voz alta indisponível';
    } else {
        botaoLeitura.addEventListener('click', () => {
            if (leituraAtiva) {
                window.speechSynthesis.cancel();
                leituraAtiva = false;
                botaoLeitura.setAttribute('aria-pressed', 'false');
                botaoLeitura.textContent = 'Ouvir conteúdo';
                return;
            }

            const conteudo = document.querySelector('main') || document.body;
            const copia = conteudo.cloneNode(true);
            copia.querySelectorAll('script, style, button, input, select, textarea, nav, [hidden]').forEach((elemento) => elemento.remove());
            const texto = copia.textContent.replace(/\s+/g, ' ').trim();
            if (!texto) return;

            const fala = new SpeechSynthesisUtterance(texto);
            fala.lang = 'pt-BR';
            fala.addEventListener('end', () => {
                leituraAtiva = false;
                botaoLeitura.setAttribute('aria-pressed', 'false');
                botaoLeitura.textContent = 'Ouvir conteúdo';
            });
            fala.addEventListener('error', () => {
                leituraAtiva = false;
                botaoLeitura.setAttribute('aria-pressed', 'false');
                botaoLeitura.textContent = 'Ouvir conteúdo';
            });
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(fala);
            leituraAtiva = true;
            botaoLeitura.setAttribute('aria-pressed', 'true');
            botaoLeitura.textContent = 'Parar leitura';
        });
    }
});
