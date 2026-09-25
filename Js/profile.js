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
                        <label for="editTipo">Tipo de diabetes<input type="text" id="editTipo" readonly></label>
                        <label for="editIdade">Idade<input type="number" id="editIdade" readonly required></label>
                        <label for="editEmail">E-mail<input type="email" id="editEmail" required></label>
                        <label for="editCelular">Celular<input type="tel" id="editCelular" inputmode="numeric" maxlength="11" placeholder="Somente números"></label>
                        <label for="editFatorSensibilidade">Fator de sensibilidade
                            <input type="number" id="editFatorSensibilidade" min="1" max="600" step="0.1" required>
                            <span class="warning-text" id="fatorWarning">O limite máximo é 600.</span>
                        </label>
                        <label for="editHgtAlvo">HGT alvo (mg/dL)
                            <input type="number" id="editHgtAlvo" min="1" max="600" step="0.1" required>
                            <span class="warning-text" id="hgtWarning">O limite máximo é 600.</span>
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

    // Adicionar validação para limitar os valores a 600 e exibir aviso
    const fatorInput = document.getElementById('editFatorSensibilidade');
    const hgtAlvoInput = document.getElementById('editHgtAlvo');

    [fatorInput, hgtAlvoInput].forEach((input) => {
        input.addEventListener('input', () => {
            const warningId = input.id === 'editFatorSensibilidade' ? 'fatorWarning' : 'hgtWarning';
            const warningEl = document.getElementById(warningId);

            if (Number(input.value) > 600) {
                input.value = 600; // Limita o valor a 600
                warningEl.style.display = 'block'; // Mostra o aviso
            } else {
                warningEl.style.display = 'none'; // Esconde o aviso
            }
        });
    });

    const celularInput = document.getElementById('editCelular');
    if (celularInput) {
        celularInput.addEventListener('input', () => {
            celularInput.value = celularInput.value.replace(/\D/g, '').slice(0, 11);
        });
    }
}

    function openModal() {
        ensureModal();
        const profile = getProfile();
        document.getElementById('editTipo').value = profile.tipo || '';
        document.getElementById('editIdade').value = calcularIdadeAtual(profile);
        document.getElementById('editEmail').value = profile.email || '';
        document.getElementById('editCelular').value = profile.celular || '';
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
        const profile = getProfile();
        if (!profile.idade) {
            alert('A idade é obrigatória. Complete a configuração inicial antes de salvar.');
            return;
        }
    
        const email = document.getElementById('editEmail').value.trim();
        let fatorSensibilidade = Number(document.getElementById('editFatorSensibilidade').value);
        let hgtAlvo = Number(document.getElementById('editHgtAlvo').value);
    
        // Limitar os valores a 600
        if (fatorSensibilidade > 600) fatorSensibilidade = 600;
        if (hgtAlvo > 600) hgtAlvo = 600;
    
        if (!email || !Number.isFinite(fatorSensibilidade) || fatorSensibilidade <= 0 || !Number.isFinite(hgtAlvo) || hgtAlvo <= 0) {
            alert('Informe um e-mail, fator de sensibilidade e HGT alvo válidos. O HGT alvo deve ser no máximo 600.');
            return;
        }
    
        profile.email = email;
        profile.celular = document.getElementById('editCelular').value.replace(/\D/g, '').slice(0, 11);
        profile.fatorSensibilidade = fatorSensibilidade;
        profile.hgtAlvo = hgtAlvo;
    
        // Salva também na estrutura de usuário para compatibilidade com o dashboard e o cadastro
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario) {
            usuario.fatorSensibilidade = profile.fatorSensibilidade;
            usuario.hgtAlvo = profile.hgtAlvo;
            usuario.email = profile.email;
            usuario.celular = profile.celular;
            usuario.idade = profile.idade;
            localStorage.setItem('usuario', JSON.stringify(usuario));
        }
    
        const fileInput = document.getElementById('editPhoto');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profile.photo = event.target.result;
                saveProfile(profile);
                closeModal();
            };
            reader.onerror = () => alert('Não foi possível carregar a foto selecionada.');
            reader.readAsDataURL(fileInput.files[0]);
            return;
        }
    
        saveProfile(profile);
        closeModal();
    }

    // expose editarPerfil to global scope for existing onclick handlers
    window.editarPerfil = openModal;

    // Initial load
    const profile = getProfile();
    updateUI(profile);

});

function logout() {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('profile');
    localStorage.removeItem('usuario');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}
