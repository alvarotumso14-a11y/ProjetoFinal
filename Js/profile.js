document.addEventListener('DOMContentLoaded', () => {
    // LOCAL STORAGE: estrutura padrão para o perfil. O objeto é usado como fallback quando
    // não há dados gravados em localStorage. A chave utilizada é 'profile' e o valor
    // é armazenado em JSON via saveProfile/getProfile.
    const defaultProfile = {
        nome: 'Usuário',
        tipo: 'Tipo de Diabetes',
        idade: '',
        email: '',
        celular: '',
        photo: '',
        fatorSensibilidade: '',
        hgtAlvo: ''
    };
    let salvandoPerfil = false;

    function garantirMenuConta() {
        document.querySelectorAll(".user-top").forEach((userTop) => {
            if (userTop.querySelector(".account-dropdown")) return;
            const menu = document.createElement("details");
            menu.className = "account-dropdown";
            menu.innerHTML = `
                <summary aria-label="Abrir opções da conta">
                    <span aria-hidden="true">⌄</span>
                </summary>
                <div class="account-dropdown-menu">
                    <a href="Profile.html">Editar perfil</a>
                    <button type="button">Sair</button>
                </div>
            `;
            menu.querySelector("button").addEventListener("click", () => window.logout());
            userTop.appendChild(menu);
        });

        if (document.documentElement.dataset.accountMenuBound === "true") return;
        document.documentElement.dataset.accountMenuBound = "true";
        document.addEventListener("click", (event) => {
            document.querySelectorAll(".account-dropdown[open]").forEach((menu) => {
                if (!menu.contains(event.target)) menu.open = false;
            });
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.querySelectorAll(".account-dropdown[open]").forEach((menu) => {
                    menu.open = false;
                });
            }
        });
    }

    function calcularIdadeAtual(profile) {
        const idadeInicial = Number(profile.idadeInicial ?? profile.idade);
        if (!Number.isFinite(idadeInicial) || idadeInicial < 1) return '';

        const referencia = new Date(profile.idadeDataReferencia || new Date().toISOString());
        const agora = new Date();
        let idade = idadeInicial;
        let aniversarios = agora.getFullYear() - referencia.getFullYear();
        const aindaNaoCompletou = agora.getMonth() < referencia.getMonth()
            || (agora.getMonth() === referencia.getMonth() && agora.getDate() < referencia.getDate());
        if (aindaNaoCompletou) aniversarios -= 1;
        return String(Math.max(idade, idade + aniversarios));
    }

    function getProfile() {
        try {
            const raw = localStorage.getItem('profile');
            return raw ? JSON.parse(raw) : defaultProfile;
        } catch (e) {
            return defaultProfile;
        }
    }

    function saveProfile(profile) {
        localStorage.setItem('profile', JSON.stringify(profile));
        updateUI(profile);
    }

    function updateUI(profile) {
        const idadeAtual = calcularIdadeAtual(profile);
        if (idadeAtual) {
            if (!profile.idadeInicial) {
                profile.idadeInicial = Number(profile.idade);
            }
            profile.idade = idadeAtual;
            localStorage.setItem('profile', JSON.stringify(profile));
        }
        // Profile page fields
        const map = {
            nome: '#nome',
            tipo: '#tipo',
            idade: '#idade',
            email: '#email',
            celular: '#celular',
            fatorSensibilidade: '#fator',
            hgtAlvo: '#hgtAlvo'
        };
        Object.keys(map).forEach((k) => {
            const el = document.querySelector(map[k]);
            if (!el) return;

            if (k === 'fatorSensibilidade') {
                el.textContent = profile[k] !== undefined && profile[k] !== '' ? `${profile[k]} mg/dL` : '—';
                return;
            }

            if (k === 'hgtAlvo') {
                el.textContent = profile[k] !== undefined && profile[k] !== '' ? `${profile[k]} mg/dL` : '—';
                return;
            }

            el.textContent = profile[k] || (k === 'nome' ? 'Nome do Usuário' : '—');
        });
        const nomeResumo = document.querySelector('#nomeResumo');
        if (nomeResumo) nomeResumo.textContent = profile.nome || 'Nome do Usuário';

        // Topbar user-info (first and second p)
        const userInfoPs = document.querySelectorAll('.user-top .user-info p');
        if (userInfoPs && userInfoPs.length >= 2) {
            userInfoPs[0].textContent = profile.nome || 'Nome do Usuário';
            userInfoPs[1].textContent = profile.tipo || 'Tipo de Diabetes';
        }

        // Topbar photo: replace content with img or initials and make it a button
        const fotoEls = document.querySelectorAll('.user-top .foto');
        fotoEls.forEach((fotoEl) => {
            fotoEl.innerHTML = '';
            fotoEl.style.cursor = 'pointer';
            if (profile.photo) {
                const img = document.createElement('img');
                img.src = profile.photo;
                img.alt = profile.nome || 'Foto do usuário';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                fotoEl.appendChild(img);
            } else {
                // show initials or FT
                const initials = (profile.nome || 'FT').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() || 'FT';
                fotoEl.textContent = initials;
                fotoEl.style.display = 'flex';
                fotoEl.style.alignItems = 'center';
                fotoEl.style.justifyContent = 'center';
                fotoEl.style.fontWeight = '700';
            }

            fotoEl.onclick = () => {
                // navigate to profile page
                window.location.href = 'Profile.html';
            };
        });
        garantirMenuConta();

        // Atualiza a foto grande na página de perfil (se existir) para usar a mesma imagem selecionada
        const fotoGrandes = document.querySelectorAll('.foto-grande');
        fotoGrandes.forEach((el) => {
            el.innerHTML = '';
            if (profile.photo) {
                const img = document.createElement('img');
                img.src = profile.photo;
                img.alt = profile.nome || 'Foto do usuário';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                el.appendChild(img);
            } else {
                const initials = (profile.nome || 'FT').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() || 'FT';
                el.textContent = initials;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.fontWeight = '700';
            }
        });

        updateGreeting(profile);
    }

    function updateGreeting(profile) {
        const firstName = (profile.nome || 'Usuário').split(' ')[0];
        // Update main header greeting(s) on dashboard if present
        const headerH1 = document.querySelector('.conteudo header h1');
        if (headerH1) {
            headerH1.textContent = `Olá, ${firstName}`;
        }

        // Update any other greeting that matches pattern
        const allH1 = document.querySelectorAll('h1');
        allH1.forEach((h) => {
            if (/^Olá,?/i.test(h.textContent) && h !== headerH1) {
                h.textContent = `Olá, ${firstName}`;
            }
        });
    }

    // CONTROLE DO MODAL: cria um modal reutilizável para editar o perfil.
    // A estrutura segue o padrão .modal/.modal-box do projeto para consistência visual.
    // A função só cria o elemento uma vez (id 'profileEditModal') e wire os botões de ação.
    function ensureModal() {
        if (document.getElementById('profileEditModal')) return;
        const modal = document.createElement('div');
        modal.id = 'profileEditModal';
        modal.className = 'modal';
        modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-topo">
                <h2>Editar Perfil</h2>
                <button class="close" type="button" aria-label="Fechar">&times;</button>
            </div>
            <div class="modal-corpo">
                <div class="edit-form">
                    <p class="form-intro">Atualize suas informações para personalizar sua experiência.</p>
                    <div class="form-grid">
                        <label class="full-width" for="editNome">Nome<input type="text" id="editNome" maxlength="100" required></label>
                        <label for="editTipo">Tipo de diabetes
                            <select id="editTipo" required>
                                <option value="Tipo 1">Tipo 1</option>
                                <option value="Tipo 2">Tipo 2</option>
                                <option value="Gestacional">Gestacional</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </label>
                        <label for="editIdade">Idade
                            <input type="number" id="editIdade" min="1" max="120" step="1" required>
                            <span class="warning-text" id="idadeWarning" role="status" aria-live="polite">Limite máximo e de 120 anos</span>
                        </label>
                        <label for="editEmail">E-mail<input type="email" id="editEmail" required></label>
                        <label for="editCelular">Celular<input type="tel" id="editCelular" inputmode="tel" autocomplete="tel" maxlength="15" placeholder="(11) 91234-5678"></label>
                        <label for="editFatorSensibilidade">Fator de sensibilidade
                            <input type="number" id="editFatorSensibilidade" min="1" max="501" step="0.1" required>
                            <span class="warning-text" id="fatorWarning" role="status" aria-live="polite">Limite máximo de 501 atingido.</span>
                        </label>
                        <label for="editHgtAlvo">HGT alvo (mg/dL)
                            <input type="number" id="editHgtAlvo" min="1" max="501" step="0.1" required>
                            <span class="warning-text" id="hgtWarning" role="status" aria-live="polite">Limite máximo de 501 mg/dL atingido.</span>
                        </label>
                        <label class="full-width" for="editPhoto">Foto do perfil<input type="file" id="editPhoto" accept="image/*"></label>
                    </div>
                    <div class="modal-actions">
                        <button id="cancelProfileBtn" type="button" class="button-secondary">Cancelar</button>
                        <button id="saveProfileBtn" type="button">Salvar alterações</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modal);

    // wire buttons
    const closeEl = modal.querySelector('.close');
    if (closeEl) closeEl.onclick = closeModal;
    const cancelBtn = document.getElementById('cancelProfileBtn');
    if (cancelBtn) cancelBtn.onclick = closeModal;
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.onclick = saveFromModal;

    const celularInput = document.getElementById('editCelular');
    if (celularInput) {
        FormInputs.telefone(celularInput);
    }

    FormInputs.limitarInteiro(
        document.getElementById('editIdade'),
        120,
        document.getElementById('idadeWarning')
    );
    FormInputs.limitarNumero(
        document.getElementById('editFatorSensibilidade'),
        501,
        document.getElementById('fatorWarning')
    );
    FormInputs.limitarNumero(
        document.getElementById('editHgtAlvo'),
        501,
        document.getElementById('hgtWarning')
    );
}

    function openModal() {
        ensureModal();
        if (!salvandoPerfil) {
            const botaoSalvar = document.getElementById('saveProfileBtn');
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = 'Salvar alterações';
        }
        const profile = getProfile();
        document.getElementById('editNome').value = profile.nome || '';
        document.getElementById('editTipo').value = profile.tipo || 'Tipo 1';
        document.getElementById('editIdade').value = calcularIdadeAtual(profile);
        document.getElementById('editEmail').value = profile.email || '';
        document.getElementById('editCelular').value = FormInputs.formatarTelefone(profile.celular);
        document.getElementById('editFatorSensibilidade').value = profile.fatorSensibilidade || '';
        document.getElementById('editHgtAlvo').value = profile.hgtAlvo || '';
        document.getElementById('editPhoto').value = '';
        const modal = document.getElementById('profileEditModal');
        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) modal.style.display = 'none';
    }

    // SALVAR DO MODAL: coleta os valores do formulário, converte a imagem (se houver)
    // para dataURL usando FileReader e persiste tudo em localStorage via saveProfile().
    // Fecha o modal após salvar.
    function saveFromModal() {
        if (salvandoPerfil) return;

        const profile = getProfile();
        const nome = document.getElementById('editNome').value.trim();
        const tipoDiabetes = document.getElementById('editTipo').value;
        const idade = Number(document.getElementById('editIdade').value);

        if (!nome) {
            mostrarAlerta('Informe o nome.');
            return;
        }

        if (!Number.isInteger(idade) || idade < 1 || idade > 120) {
            mostrarAlerta('A idade é obrigatória e deve estar entre 1 e 120.');
            return;
        }
    
        const email = document.getElementById('editEmail').value.trim();
        const fatorSensibilidade = Number(document.getElementById('editFatorSensibilidade').value);
        const hgtAlvo = Number(document.getElementById('editHgtAlvo').value);
        const emailAnterior = String(profile.email || '').toLowerCase();
        const emailNovo = email.toLowerCase();

        if (!email || !Number.isFinite(fatorSensibilidade) || fatorSensibilidade < 1
            || fatorSensibilidade > 501 || !Number.isFinite(hgtAlvo) || hgtAlvo < 1 || hgtAlvo > 501) {
            mostrarAlerta('Informe um e-mail, fator de sensibilidade e HGT alvo válidos entre 1 e 501.');
            return;
        }

        salvandoPerfil = true;
        const botaoSalvar = document.getElementById('saveProfileBtn');
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = 'Salvando...';
    
        const celular = document.getElementById('editCelular').value.replace(/\D/g, '').slice(0, 11);
        if (celular && ![10, 11].includes(celular.length)) {
            mostrarAlerta('Informe um telefone com DDD e 10 ou 11 dígitos.');
            salvandoPerfil = false;
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = 'Salvar alterações';
            document.getElementById('editCelular').focus();
            return;
        }
        const hgtAlvoInteiro = Math.round(hgtAlvo);
        const fatorArredondado = fatorSensibilidade;

        if (fatorArredondado < 1) {
            mostrarAlerta('O fator de sensibilidade deve ser no mínimo 1.');
            salvandoPerfil = false;
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = 'Salvar alterações';
            return;
        }

        const concluir = async (photo) => {
            try {
                await UsuarioApi.atualizarPerfil({
                name: nome,
                tipoDiabetes,
                idade,
                email,
                celular,
                fatorSensibilidade: fatorArredondado,
                hgtAlvo: hgtAlvoInteiro
                });
                profile.nome = nome;
                profile.tipo = tipoDiabetes;
                profile.idade = String(idade);
                delete profile.idadeInicial;
                delete profile.idadeDataReferencia;
                profile.email = emailNovo === emailAnterior ? emailNovo : emailAnterior;
                profile.celular = celular;
                profile.fatorSensibilidade = fatorArredondado;
                profile.hgtAlvo = hgtAlvoInteiro;
                if (photo !== undefined) profile.photo = photo; // foto fica só neste navegador
                saveProfile(profile);
                closeModal();
                if (emailNovo !== emailAnterior) {
                    sessionStorage.setItem('alteracaoEmailPendente', JSON.stringify({ email: emailNovo }));
                    window.location.href = 'confirmar-email.html';
                    return;
                }
                mostrarNotificacao('Perfil salvo com sucesso.');
                botaoSalvar.textContent = 'Salvo';
            } catch (erro) {
                mostrarAlerta(erro.message);
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = 'Salvar alterações';
            } finally {
                salvandoPerfil = false;
            }
        };

        const fileInput = document.getElementById('editPhoto');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target.result !== 'string') {
                    salvandoPerfil = false;
                    botaoSalvar.disabled = false;
                    botaoSalvar.textContent = 'Salvar alterações';
                    mostrarAlerta('Não foi possível carregar a foto selecionada.');
                    return;
                }
                concluir(event.target.result);
            };
            reader.onerror = () => {
                salvandoPerfil = false;
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = 'Salvar alterações';
                mostrarAlerta('Não foi possível carregar a foto selecionada.');
            };
            reader.readAsDataURL(fileInput.files[0]);
            return;
        }

        concluir(undefined);
    }

    // expose editarPerfil to global scope for existing onclick handlers
    window.editarPerfil = openModal;

    // Excluir conta desativa o acesso e preserva os dados para reativação.
    window.excluirConta = async function () {
        if (!confirm('Excluir sua conta? Ela será desativada e seus dados ficarão guardados. Você pode reativá-la em Criar conta com seu e-mail e senha atual.')) return;
        try {
            await UsuarioApi.desativar();
            limparSessao();
            sessionStorage.setItem('avisoLogin', 'Conta desativada. Para reativar, clique em Criar conta e informe seu e-mail.');
            window.location.href = 'login.html';
        } catch (erro) {
            mostrarAlerta(erro.message);
        }
    };
    // Initial load: mostra o que está salvo e depois atualiza com os dados da API
    const profile = getProfile();
    updateUI(profile);

    if (typeof estaLogado === 'function' && estaLogado()) {
        UsuarioApi.perfil()
            .then((usuario) => {
                salvarPerfilLocal(usuario);
                updateUI(getProfile());
            })
            .catch((erro) => console.warn('Não foi possível atualizar o perfil pela API.', erro));
    }

});
