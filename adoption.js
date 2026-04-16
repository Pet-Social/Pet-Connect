import { supabaseUrl, supabaseKey } from './config.js';

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

async function initAdoptionApp() {
    if (!window.supabase) {
        console.error('Supabase library not loaded!');
        return;
    }

    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModal');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const profileModal = document.getElementById('profileModal');
    const closeProfileBtn = document.getElementById('closeProfileModal');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('theme-toggle');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            const icon = document.getElementById('theme-icon');
            if (icon) icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
            localStorage.setItem('theme', newTheme);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttr(text) {
        if (!text) return '';
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getInitials(username) {
        if (!username) return 'U';
        const parts = username.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return username.slice(0, 2).toUpperCase();
    }

    function updateAuthButton(user, profile) {
        currentUser = user;
        currentProfile = profile;
        if (!authBtn) return;
        if (user) {
            const username = profile?.username || user.user_metadata?.full_name || user.email;
            authBtn.innerHTML = `<div class="user-avatar">${getInitials(username)}</div>`;
            authBtn.title = username;
            const toggleBtn = document.getElementById('toggleAdoptionBtn');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
        } else {
            authBtn.innerHTML = `<img src="assets/images/signUp/android-chrome-192x192.png" class="loginIcon" alt="Se connecter" />`;
            authBtn.title = 'Se connecter';
            const toggleBtn = document.getElementById('toggleAdoptionBtn');
            if (toggleBtn) toggleBtn.classList.add('hidden');
        }
    }

    async function loadProfile(userId) {
        const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return data || null;
    }

    async function createProfile(userId, username, phone = null) {
        const { data } = await supabaseClient
            .from('profiles')
            .insert([{ id: userId, username, phone }])
            .select()
            .single();
        return data;
    }

    async function logout() {
        await supabaseClient.auth.signOut();
        location.reload();
    }

    function openAuthModal() {
        if (authModal) authModal.classList.remove('hidden');
    }

    function closeAuthModal() {
        if (authModal) authModal.classList.add('hidden');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
    }

    function openProfileModal() {
        if (!currentUser) return;
        const username = currentProfile?.username || currentUser.user_metadata?.full_name || 'Utilisateur';
        const avatar = document.getElementById('profileAvatar');
        const uname = document.getElementById('profileUsername');
        const email = document.getElementById('profileEmail');
        if (avatar) avatar.textContent = getInitials(username);
        if (uname) uname.textContent = username;
        if (email) email.textContent = currentUser.email;
        if (profileModal) profileModal.classList.remove('hidden');
    }

    function closeProfileModal() {
        if (profileModal) profileModal.classList.add('hidden');
    }

    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
                currentProfile = await loadProfile(session.user.id);
                updateAuthButton(session.user, currentProfile);
                openProfileModal();
            } else {
                openAuthModal();
            }
        });
    }

    if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfileModal);
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeProfileModal();
        });
    }
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            if (signupTab) signupTab.classList.remove('active');
            if (loginForm) loginForm.classList.remove('hidden');
            if (signupForm) signupForm.classList.add('hidden');
        });
    }
    if (signupTab) {
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (signupForm) signupForm.classList.remove('hidden');
            if (loginForm) loginForm.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (!email || !password) {
                alert('Veuillez remplir tous les champs');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Chargement...';
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
            
            if (error) {
                console.error('Login error:', error);
                if (error.message.includes('Invalid login credentials')) {
                    alert('Email ou mot de passe incorrect');
                } else if (error.message.includes('Email not confirmed')) {
                    alert('Veuillez confirmer votre email');
                } else {
                    alert('Erreur de connexion: ' + error.message);
                }
                return;
            }
            
            if (data.user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                if (!profile) {
                    const username = data.user.user_metadata?.full_name || 'User';
                    const phone = data.user.user_metadata?.phone || '';
                    await supabaseClient
                        .from('profiles')
                        .insert([{ id: data.user.id, username, phone }]);
                }
            }
            
            location.reload();
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            
            if (!name || !email || !password) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            if (password.length < 6) {
                alert('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Chargement...';
            
            const { data, error } = await supabaseClient.auth.signUp({
                email, password,
                options: { data: { full_name: name, phone } }
            });
            
            submitBtn.disabled = false;
            submitBtn.textContent = "S'inscrire";
            
            if (error) {
                console.error('Signup error:', error);
                if (error.message.includes('already registered')) {
                    alert('Cet email est déjà utilisé');
                } else {
                    alert('Erreur d\'inscription: ' + error.message);
                }
                return;
            }
            
            location.reload();
        });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('profileUsernameInput').value.trim();
            const newEmail = document.getElementById('profileEmailInput').value.trim();
            const newPhone = document.getElementById('profilePhone').value.trim();
            const newPassword = document.getElementById('profilePassword').value;
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            
            if (!newUsername) {
                alert('Le nom d\'utilisateur est requis');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Chargement...';
            
            let updatePromises = [];
            
            if (newEmail && newEmail !== currentUser.email) {
                updatePromises.push(supabaseClient.auth.updateUser({ email: newEmail }));
            }
            if (newPassword) {
                if (newPassword.length < 6) {
                    alert('Le mot de passe doit contenir au moins 6 caractères');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Mettre à jour';
                    return;
                }
                updatePromises.push(supabaseClient.auth.updateUser({ password: newPassword }));
            }
            
            updatePromises.push(
                supabaseClient
                    .from('profiles')
                    .update({ username: newUsername, phone: newPhone })
                    .eq('id', currentUser.id)
            );
            
            const results = await Promise.allSettled(updatePromises);
            const errors = results.filter(r => r.status === 'rejected' || r.value?.error);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mettre à jour';
            
            if (errors.length > 0) {
                console.error('Update errors:', errors);
                alert('Erreur lors de la mise à jour du profil');
                return;
            }
            
            alert('Profil mis à jour!');
            location.reload();
        });
    }

    async function checkUserSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            currentProfile = await loadProfile(session.user.id);
            updateAuthButton(session.user, currentProfile);
        } else {
            updateAuthButton(null, null);
        }
        loadAdoptions();
    }

    await checkUserSession();

    const toggleBtn = document.getElementById('toggleAdoptionBtn');
    const cancelBtn = document.getElementById('cancelAdoptionBtn');
    const adoptionSection = document.getElementById('adoptionSection');
    const adoptionForm = document.getElementById('adoptionForm');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (!currentUser) {
                openAuthModal();
                return;
            }
            const phoneInput = document.getElementById('contactPhone');
            if (phoneInput) {
                phoneInput.value = currentProfile?.phone || currentUser.email;
            }
            if (adoptionSection) adoptionSection.classList.remove('hidden');
            if (toggleBtn) toggleBtn.classList.add('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (adoptionSection) adoptionSection.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            if (adoptionForm) adoptionForm.reset();
        });
    }

    if (adoptionForm) {
        adoptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                openAuthModal();
                return;
            }

            const petName = document.getElementById('petName').value.trim();
            const petAge = document.getElementById('petAge').value;
            const petType = document.getElementById('petType').value;
            const contactPhone = document.getElementById('contactPhone').value;
            const vaxStatus = document.querySelector('input[name="vaxStatus"]:checked').value;
            const vaccines = Array.from(document.querySelectorAll('input[name="vaccines"]:checked')).map(cb => cb.value);
            const imageFile = document.getElementById('petImage').files[0];

            const submitBtn = adoptionForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publication...';

            let imageUrl = null;
            if (imageFile) {
                const fileName = `adoptions/${currentUser.id}/${Date.now()}.${imageFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabaseClient.storage.from('adoption-images').upload(fileName, imageFile);
                
                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert('Erreur lors de l\'upload de l\'image');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publier';
                    return;
                }
                
                const { data: urlData } = supabaseClient.storage.from('adoption-images').getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            const { error } = await supabaseClient.from('adoptions').insert([{
                user_id: currentUser.id,
                pet_name: petName,
                pet_age: petAge,
                pet_type: petType,
                contact_phone: contactPhone,
                vaccination_status: vaxStatus,
                vaccines: vaccines,
                image_url: imageUrl
            }]);

            submitBtn.disabled = false;
            submitBtn.textContent = 'Publier';

            if (error) {
                alert('Erreur: ' + error.message);
                return;
            }

            adoptionForm.reset();
            if (adoptionSection) adoptionSection.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            loadAdoptions();
        });
    }

    const petTypeSelect = document.getElementById('petType');
    if (petTypeSelect) {
        petTypeSelect.addEventListener('change', (e) => {
            const dogVax = document.querySelectorAll('.dog-vax');
            const catVax = document.querySelectorAll('.cat-vax');
            if (e.target.value === 'Chien') {
                dogVax.forEach(el => el.classList.remove('hidden'));
                catVax.forEach(el => el.classList.add('hidden'));
            } else {
                dogVax.forEach(el => el.classList.add('hidden'));
                catVax.forEach(el => el.classList.remove('hidden'));
            }
        });
    }

    const vaxRadios = document.querySelectorAll('input[name="vaxStatus"]');
    const vaccineList = document.getElementById('vaccineList');
    vaxRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (vaccineList) {
                if (document.querySelector('input[name="vaxStatus"]:checked').value === 'Vaccinated') {
                    vaccineList.classList.remove('hidden');
                } else {
                    vaccineList.classList.add('hidden');
                }
            }
        });
    });

    async function loadAdoptions() {
        const adoptionList = document.getElementById('adoptionList');
        if (!adoptionList) return;

        adoptionList.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Chargement...</p>';

        const { data: adoptions, error } = await supabaseClient
            .from('adoptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Adoption load error:', error);
            adoptionList.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Erreur: ' + error.message + '</p>';
            return;
        }

        if (!adoptions || adoptions.length === 0) {
            adoptionList.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Aucun animal en adoption pour le moment</p>';
            return;
        }

        const userIds = [...new Set(adoptions.map(a => a.user_id))];
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username, phone')
            .in('id', userIds);

        const profileMap = {};
        if (profiles) {
            profiles.forEach(p => profileMap[p.id] = { username: p.username, phone: p.phone });
        }

        adoptionList.innerHTML = '';
        adoptions.forEach(adoption => {
            const isOwner = currentUser && currentUser.id === adoption.user_id;
            const card = document.createElement('div');
            card.className = 'adoption-card';

            const petEmoji = adoption.pet_type === 'Chien' ? '🐕' : '🐈';
            const vaxIcon = adoption.vaccination_status === 'Vaccinated' ? '✅' : '❌';
            const vaccinesText = adoption.vaccines && adoption.vaccines.length > 0
                ? adoption.vaccines.join(', ')
                : 'Aucun';
            const contactPhone = profileMap[adoption.user_id]?.phone || adoption.contact_phone;
            const petName = escapeHtml(adoption.pet_name);
            const ownerName = escapeHtml(profileMap[adoption.user_id]?.username) || 'Utilisateur';

            card.innerHTML = `
                ${adoption.image_url ? `<img src="${adoption.image_url}" class="adoption-image" alt="${petName}" loading="lazy" />` : `<div class="adoption-image-placeholder">${petEmoji}</div>`}
                <div class="adoption-content">
                    <div class="adoption-header">
                        <span class="adoption-pet-name">${petEmoji} ${petName}</span>
                        ${isOwner ? `<div class="adoption-actions"><button class="adoption-delete-btn" data-id="${adoption.id}">Supprimer</button></div>` : ''}
                    </div>
                    <p class="adoption-info"><strong>Type:</strong> ${escapeHtml(adoption.pet_type)}</p>
                    <p class="adoption-info"><strong>Âge:</strong> ${escapeHtml(adoption.pet_age)} an(s)</p>
                    <p class="adoption-info"><strong>Vacciné:</strong> ${vaxIcon} ${adoption.vaccination_status === 'Vaccinated' ? 'Oui' : 'Non'}</p>
                    ${adoption.vaccines && adoption.vaccines.length > 0 ? `<p class="adoption-info"><strong>Vaccins:</strong> ${escapeHtml(vaccinesText)}</p>` : ''}
                    ${contactPhone ? `<p class="adoption-info"><strong>Contact:</strong> <a href="tel:${escapeAttr(contactPhone)}">${escapeHtml(contactPhone)}</a></p>` : ''}
                    <p class="adoption-info"><strong>Proposé par:</strong> ${ownerName}</p>
                    <p class="adoption-info"><strong>Date:</strong> ${new Date(adoption.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
            `;
            adoptionList.appendChild(card);
        });

        document.querySelectorAll('.adoption-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('Supprimer cette annonce?')) return;
                const id = e.target.dataset.id;
                const { data: adoption } = await supabaseClient.from('adoptions').select('image_url').eq('id', id).single();
                if (adoption?.image_url) {
                    const fileName = adoption.image_url.split('/adoption-images/')[1];
                    if (fileName) await supabaseClient.storage.from('adoption-images').remove([fileName]);
                }
                await supabaseClient.from('adoptions').delete().eq('id', id);
                loadAdoptions();
            });
        });
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            updateAuthButton(session.user, null);
        } else if (event === 'SIGNED_OUT') {
            updateAuthButton(null, null);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAdoptionApp());
} else {
    initAdoptionApp();
}
