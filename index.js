import { supabaseUrl, supabaseKey } from './config.js';

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

async function initApp() {
    console.log('Pet Connect initializing...');
    
    // Initialize Supabase
    if (!window.supabase) {
        console.error('Supabase library not loaded!');
        return;
    }
    
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase initialized');
    
    // Get DOM elements
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
    
    // Theme setup
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }

    // Avoid initial background transition on reload; enable transitions after first paint.
    requestAnimationFrame(() => {
        document.body.classList.add('theme-ready');
    });
    
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
    
    // Auth button handler
    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            console.log('Auth button clicked');
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
    
    // Modal functions
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
        } else {
            authBtn.innerHTML = `<img src="assets/images/signUp/android-chrome-192x192.png" class="loginIcon" alt="Se connecter" />`;
            authBtn.title = 'Se connecter';
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
        localStorage.removeItem('justLoggedIn');
        location.reload();
    }
    
    // Close buttons
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

    const closeEditBtn = document.getElementById('closeEditPostModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const deletePostFromModalBtn = document.getElementById('deletePostBtn');
    const editPostForm = document.getElementById('editPostForm');
    const editModal = document.getElementById('editPostModal');

    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', closeEditModal);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
    }
    if (deletePostFromModalBtn) {
        deletePostFromModalBtn.addEventListener('click', async () => {
            if (!confirm('Supprimer ce post?')) return;
            if (currentEditPostId) {
                const { data: post } = await supabaseClient.from('posts').select('image_url').eq('id', currentEditPostId).single();
                if (post?.image_url) {
                    const fileName = post.image_url.split('/post-images/')[1];
                    if (fileName) await supabaseClient.storage.from('post-images').remove([fileName]);
                }
                await supabaseClient.from('posts').delete().eq('id', currentEditPostId);
                closeEditModal();
                loadPosts();
            }
        });
    }
    if (editPostForm) {
        editPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentEditPostId) return;
            const newCaption = document.getElementById('editPostCaption').value;
            await supabaseClient.from('posts').update({ caption: newCaption }).eq('id', currentEditPostId);
            closeEditModal();
            loadPosts();
        });
    }
    
    // Tab switching
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
    
    // Helper function to show error
    function showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        const errorText = document.getElementById('authErrorText');
        if (errorDiv) {
            if (errorText) errorText.textContent = message;
            errorDiv.classList.remove('hidden');
        } else {
            alert(message);
        }
    }
    
    // Helper function to hide error
    function hideAuthError() {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    // Helper function to set loading state on buttons
    function setAuthLoading(button, loading) {
        if (!button) return;
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Chargement...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthError();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (!email || !password) {
                showAuthError('Veuillez remplir tous les champs');
                return;
            }
            
            setAuthLoading(submitBtn, true);
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            setAuthLoading(submitBtn, false);
            
            if (error) {
                console.error('Login error:', error);
                if (error.message.includes('Invalid login credentials')) {
                    showAuthError('Email ou mot de passe incorrect');
                } else if (error.message.includes('Email not confirmed')) {
                    showAuthError('Veuillez confirmer votre email');
                } else {
                    showAuthError('Erreur de connexion: ' + error.message);
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
                    const { error: profileError } = await supabaseClient
                        .from('profiles')
                        .insert([{ id: data.user.id, username }]);
                    
                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                    }
                }
            }
            
            localStorage.setItem('justLoggedIn', 'true');
            location.reload();
        });
    }
    
    // Signup form
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthError();
            
            const name = document.getElementById('signupName').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            
            if (!name || !email || !password) {
                showAuthError('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            if (password.length < 6) {
                showAuthError('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }
            
            setAuthLoading(submitBtn, true);
            
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { full_name: name, phone } }
            });
            
            setAuthLoading(submitBtn, false);
            
            if (error) {
                console.error('Signup error:', error);
                if (error.message.includes('already registered')) {
                    showAuthError('Cet email est déjà utilisé');
                } else {
                    showAuthError('Erreur d\'inscription: ' + error.message);
                }
                return;
            }
            
            localStorage.setItem('justLoggedIn', 'true');
            location.reload();
        });
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('profileUsernameInput').value.trim();
            const newEmail = document.getElementById('profileEmailInput').value.trim();
            const newPhone = document.getElementById('profilePhone').value.trim();
            const newPassword = document.getElementById('profilePassword').value;
            
            if (!newUsername) {
                alert('Le nom d\'utilisateur est requis');
                return;
            }
            
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            setAuthLoading(submitBtn, true);
            
            let updatePromises = [];
            
            if (newEmail && newEmail !== currentUser.email) {
                updatePromises.push(supabaseClient.auth.updateUser({ email: newEmail }));
            }
            if (newPassword) {
                if (newPassword.length < 6) {
                    alert('Le mot de passe doit contenir au moins 6 caractères');
                    setAuthLoading(submitBtn, false);
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
            
            setAuthLoading(submitBtn, false);
            
            if (errors.length > 0) {
                console.error('Update errors:', errors);
                alert('Erreur lors de la mise à jour du profil');
                return;
            }
            
            alert('Profil mis à jour!');
            location.reload();
        });
    }
    
    // Filter variables (declare before use)
    let currentFilter = 'all';
    
    // Load posts
    async function loadPosts() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) {
            console.log('No postsContainer found');
            return;
        }
        if (!supabaseClient) {
            console.log('No supabaseClient, retrying...');
            setTimeout(() => loadPosts(), 50);
            return;
        }
        
        console.log('Loading posts...');
        postsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Chargement...</p>';
        
        let query = supabaseClient.from('posts').select('*, profiles:user_id (username)');
        
        if (currentFilter === 'my' && currentUser) {
            query = query.eq('user_id', currentUser.id);
        }
        
        const { data: posts, error } = await query.order('created_at', { ascending: false });
        
        console.log('Posts query result:', { posts, error });
        
        if (error) {
            console.error('Error loading posts:', error);
            postsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Erreur de chargement</p>';
            return;
        }
        
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Aucun post</p>';
            return;
        }
        
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'post-card';
            const isOwner = currentUser && currentUser.id === post.user_id;
            div.innerHTML = `
                <div class="post-header">
                    <span class="post-owner">${post.profiles?.username || 'Utilisateur'}</span>
                    <div class="post-date">${new Date(post.created_at).toLocaleDateString()}</div>
                </div>
                <img src="${post.image_url}" class="post-image" alt="Post" />
                <div class="post-footer">
                    <span class="post-caption">${post.caption || ''}</span>
                    ${isOwner ? '<div class="post-owner-actions"><button class="post-delete-btn" data-id="' + post.id + '">🗑️</button><button class="post-edit-btn" data-id="' + post.id + '" data-caption="' + encodeURIComponent(post.caption || '') + '">✍️</button></div>' : ''}
                </div>
            `;
            postsContainer.appendChild(div);
        });
        
        document.querySelectorAll('.post-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('Supprimer ce post?')) return;
                const id = e.target.dataset.id;
                const { data: post } = await supabaseClient.from('posts').select('image_url').eq('id', id).single();
                if (post?.image_url) {
                    const fileName = post.image_url.split('/post-images/')[1];
                    if (fileName) await supabaseClient.storage.from('post-images').remove([fileName]);
                }
                await supabaseClient.from('posts').delete().eq('id', id);
                loadPosts();
            });
        });

        document.querySelectorAll('.post-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const caption = decodeURIComponent(e.target.dataset.caption);
                openEditModal(id, caption);
            });
        });
    }

    let currentEditPostId = null;

    function openEditModal(postId, caption) {
        currentEditPostId = postId;
        const editModal = document.getElementById('editPostModal');
        const captionInput = document.getElementById('editPostCaption');
        if (captionInput) captionInput.value = caption;
        if (editModal) editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        const editModal = document.getElementById('editPostModal');
        if (editModal) editModal.classList.add('hidden');
        currentEditPostId = null;
    }
    
    // Check session and load initial data
    async function checkUserSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            currentProfile = await loadProfile(session.user.id);
            updateAuthButton(session.user, currentProfile);
            
            if (localStorage.getItem('justLoggedIn') === 'true') {
                localStorage.removeItem('justLoggedIn');
                const postSection = document.getElementById('postSection');
                const toggleBtn = document.getElementById('togglePostBtn');
                const loginPrompt = document.getElementById('postLoginPrompt');
                if (postSection) postSection.classList.remove('hidden');
                if (toggleBtn) toggleBtn.classList.add('hidden');
                if (loginPrompt) loginPrompt.classList.add('hidden');
            }
        } else {
            updateAuthButton(null, null);
        }
        loadPosts();
    }
    
    // Check session (must complete before event listeners run)
    await checkUserSession();
    
    // Ensure posts are loaded after session check
    setTimeout(() => {
        console.log('Delayed loadPosts call');
        loadPosts();
    }, 100);
    
    // Post form (index page only)
    const postForm = document.getElementById('postForm');
    const toggleBtn = document.getElementById('togglePostBtn');
    const cancelBtn = document.getElementById('cancelPostBtn');
    const postSection = document.getElementById('postSection');
    const postsContainer = document.getElementById('postsContainer');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (!currentUser) {
                openAuthModal();
                return;
            }
            if (postSection) postSection.classList.remove('hidden');
            const loginPrompt = document.getElementById('postLoginPrompt');
            if (loginPrompt) loginPrompt.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.add('hidden');
            if (postsContainer) postsContainer.classList.add('hidden');
        });
    }
    
    const promptLoginBtn = document.getElementById('promptLoginBtn');
    if (promptLoginBtn) {
        promptLoginBtn.addEventListener('click', () => {
            closeProfileModal();
            openAuthModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (postSection) postSection.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            if (postsContainer) postsContainer.classList.remove('hidden');
        });
    }
    
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                openAuthModal();
                return;
            }
            
            const imageFile = document.getElementById('postImage').files[0];
            const caption = document.getElementById('postCaption').value;
            if (!imageFile) {
                alert('Sélectionnez une image');
                return;
            }
            
            const fileName = `${currentUser.id}/${Date.now()}.${imageFile.name.split('.').pop()}`;
            await supabaseClient.storage.from('post-images').upload(fileName, imageFile);
            const { data: urlData } = supabaseClient.storage.from('post-images').getPublicUrl(fileName);
            
            await supabaseClient.from('posts').insert([{
                user_id: currentUser.id,
                image_url: urlData.publicUrl,
                caption
            }]);
            
            postForm.reset();
            if (postSection) postSection.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            if (postsContainer) postsContainer.classList.remove('hidden');
            loadPosts();
        });
    }
    
    // Filter buttons
    const filterAllBtn = document.getElementById('filterAll');
    const filterMyBtn = document.getElementById('filterMy');
    
    if (filterAllBtn) filterAllBtn.classList.add('active');
    
    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => {
            currentFilter = 'all';
            filterAllBtn.classList.add('active');
            if (filterMyBtn) filterMyBtn.classList.remove('active');
            loadPosts();
        });
    }
    if (filterMyBtn) {
        filterMyBtn.addEventListener('click', () => {
            if (!currentUser) {
                openAuthModal();
                return;
            }
            currentFilter = 'my';
            filterMyBtn.classList.add('active');
            if (filterAllBtn) filterAllBtn.classList.remove('active');
            loadPosts();
        });
    }
    
    // Auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            updateAuthButton(session.user, null);
        } else if (event === 'SIGNED_OUT') {
            updateAuthButton(null, null);
        }
    });
    
    console.log('Pet Connect ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initApp());
} else {
    initApp();
}
