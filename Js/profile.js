document.addEventListener('DOMContentLoaded', () => {
    const defaultProfile = {
        nome: 'Usuário',
        tipo: 'Tipo de Diabetes',
        idade: '',
        email: '',
        celular: '',
        photo: ''
    };

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
        // Profile page fields
        const map = {
            nome: '#nome',
            tipo: '#tipo',
            idade: '#idade',
            email: '#email',
            celular: '#celular'
        };
        Object.keys(map).forEach((k) => {
            const el = document.querySelector(map[k]);
            if (el) el.textContent = profile[k] || (k === 'nome' ? 'Nome do Usuário' : '—');
        });

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

    // Create an edit modal (reusable)
    function ensureModal() {
        if (document.getElementById('profileEditModal')) return;
        const modal = document.createElement('div');
        modal.id = 'profileEditModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-topo">
                    <h2>Editar Perfil</h2>
                    <button class="close" id="profileEditClose">&times;</button>
                </div>
                <div class="modal-corpo">
                    <div class="edit-form">
                        <label>Nome<br><input type="text" id="editNome" /></label>
                        <label>Tipo de Diabetes<br><input type="text" id="editTipo" /></label>
                        <label>Idade<br><input type="text" id="editIdade" /></label>
                        <label>Email<br><input type="email" id="editEmail" /></label>
                        <label>Celular<br><input type="text" id="editCelular" /></label>
                        <label>Foto do Perfil<br><input type="file" id="editPhoto" accept="image/*" /></label>
                        <div style="display:flex;gap:10px;margin-top:14px;">
                            <button id="saveProfileBtn">Salvar</button>
                            <button id="cancelProfileBtn" type="button">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // wire buttons
        document.getElementById('profileEditClose').onclick = closeModal;
        document.getElementById('cancelProfileBtn').onclick = closeModal;
        document.getElementById('saveProfileBtn').onclick = saveFromModal;
    }

    function openModal() {
        ensureModal();
        const profile = getProfile();
        document.getElementById('editNome').value = profile.nome || '';
        document.getElementById('editTipo').value = profile.tipo || '';
        document.getElementById('editIdade').value = profile.idade || '';
        document.getElementById('editEmail').value = profile.email || '';
        document.getElementById('editCelular').value = profile.celular || '';
        document.getElementById('editPhoto').value = '';
        const modal = document.getElementById('profileEditModal');
        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) modal.style.display = 'none';
    }

    function saveFromModal() {
        const profile = getProfile();
        profile.nome = document.getElementById('editNome').value || '';
        profile.tipo = document.getElementById('editTipo').value || '';
        profile.idade = document.getElementById('editIdade').value || '';
        profile.email = document.getElementById('editEmail').value || '';
        profile.celular = document.getElementById('editCelular').value || '';

        const fileInput = document.getElementById('editPhoto');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                profile.photo = e.target.result;
                saveProfile(profile);
                closeModal();
            };
            reader.readAsDataURL(file);
        } else {
            // no photo chosen: keep existing
            saveProfile(profile);
            closeModal();
        }
    }

    // expose editarPerfil to global scope for existing onclick handlers
    window.editarPerfil = openModal;

    // Initial load
    const profile = getProfile();
    updateUI(profile);

});
