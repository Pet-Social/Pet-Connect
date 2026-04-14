import { supabaseUrl, supabaseKey } from './config.js';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentProfile = null;

// Theme changing
function setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeIcon.textContent = savedTheme === "dark" ? "🌙" : "☀️";

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        themeIcon.textContent = newTheme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", newTheme);
    });
}
setupThemeToggle();

// Elements
const postForm = document.getElementById("postForm");
const postSection = document.getElementById("postSection");
const toggleBtn = document.getElementById("togglePostBtn");
const cancelBtn = document.getElementById("cancelPostBtn");
const postsContainer = document.getElementById("postsContainer");
const authBtn = document.getElementById("auth-btn");
const authIcon = document.getElementById("auth-icon");
const postLoginPrompt = document.getElementById("postLoginPrompt");
const promptLoginBtn = document.getElementById("promptLoginBtn");

// Test images for demo posts
const testImages = [
    "./assets/imagesfortest/anotherMoment.jpeg",
    "./assets/imagesfortest/BestMoment.jpeg",
    "./assets/imagesfortest/GoodBoy.jpeg",
    "./assets/imagesfortest/MyPet&MyChild.jpg",
    "./assets/imagesfortest/NatureWithMyPet.webp",
];

const randomNames = ["Alex", "Sam", "Lina", "Yassine", "Nour", "Karim", "Sophie", "Leo", "Maya", "Adam"];
const randomDescriptions = [
    "Regardez mon animal mignon !",
    "Moment adorable de la journée.",
    "Il fait une sieste paisible.",
    "Un moment drôle capturé !",
    "Journée ensoleillée pour mon ami."
];

function randomDate() {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - Math.floor(Math.random() * 30));
    return past.toLocaleDateString() + " " + past.toLocaleTimeString();
}

function toggleForm() {
    if (!currentUser) {
        pendingPostAction = true;
        openAuthModal();
        return;
    }
    const isHidden = postSection.classList.contains("hidden");
    if (isHidden) {
        postSection.classList.remove("hidden");
        toggleBtn.classList.add("hidden");
        postsContainer.classList.add("hidden");
    } else {
        postSection.classList.add("hidden");
        toggleBtn.classList.remove("hidden");
        postsContainer.classList.remove("hidden");
    }
}

toggleBtn.addEventListener("click", toggleForm);
cancelBtn.addEventListener("click", toggleForm);

function getInitials(username) {
    if (!username) return "U";
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
}

function updateAuthButton(user, profile) {
    if (user) {
        const username = profile?.username || user.user_metadata?.full_name || user.email;
        authBtn.innerHTML = `<div class="user-avatar">${getInitials(username)}</div>`;
        authBtn.title = username;
    } else {
        authBtn.innerHTML = `<img src="assets/images/signUp/android-chrome-192x192.png" class="loginIcon" id="auth-icon" alt="Se connecter" />`;
        authBtn.title = "Se connecter";
    }
}

function updatePostFormState() {
    if (currentUser) {
        postLoginPrompt.classList.add("hidden");
    } else {
        postLoginPrompt.classList.remove("hidden");
    }
}

async function loadProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
    }
    return data || null;
}

async function createProfile(userId, username, phone = null) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .insert([{ id: userId, username, phone }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating profile:', error);
        return null;
    }
    return data;
}

async function updateProfile(userId, updates) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }
    return data;
}

let pendingPostAction = false;

async function updateUIForLoggedInUser(user, fromPostButton = false) {
    currentUser = user;
    currentProfile = await loadProfile(user.id);
    
    updateAuthButton(user, currentProfile);
    updatePostFormState();
    
    if (fromPostButton) {
        postSection.classList.remove("hidden");
        toggleBtn.classList.add("hidden");
        postsContainer.classList.add("hidden");
        postSection.scrollIntoView({ behavior: 'smooth' });
    } else if (currentProfile) {
        openProfileModal();
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('justLoggedIn');
    location.reload();
}

// Auth Modal
const authModal = document.getElementById("authModal");
const closeAuthBtn = document.getElementById("closeAuthModal");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function openAuthModal() {
    authModal.classList.remove("hidden");
}

function closeAuthModal() {
    authModal.classList.add("hidden");
    loginForm.reset();
    signupForm.reset();
}

authBtn.addEventListener("click", () => {
    if (currentUser) {
        openProfileModal();
    } else {
        openAuthModal();
    }
});

promptLoginBtn.addEventListener("click", openAuthModal);

closeAuthBtn.addEventListener("click", closeAuthModal);

window.addEventListener("click", (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
});

signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Erreur de connexion : " + error.message);
        return;
    }

    localStorage.setItem('justLoggedIn', 'true');
    location.reload();
});

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const phone = document.getElementById("signupPhone").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name,
            }
        }
    });

    if (error) {
        alert("Erreur d'inscription : " + error.message);
        return;
    }

    if (data.user) {
        await createProfile(data.user.id, name, phone);
    }

    localStorage.setItem('justLoggedIn', 'true');
    location.reload();
});

// Profile Modal
const profileModal = document.getElementById("profileModal");
const closeProfileBtn = document.getElementById("closeProfileModal");
const profileForm = document.getElementById("profileForm");
const profileAvatar = document.getElementById("profileAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profilePasswordInput = document.getElementById("profilePassword");
const logoutBtn = document.getElementById("logoutBtn");

function openProfileModal() {
    if (!currentUser) return;
    
    const username = currentProfile?.username || currentUser.user_metadata?.full_name || "Utilisateur";
    profileAvatar.textContent = getInitials(username);
    profileUsername.textContent = username;
    profileEmail.textContent = currentUser.email;
    profileUsernameInput.value = username;
    profileEmailInput.value = currentUser.email;
    profilePhone.value = currentProfile?.phone || currentUser.user_metadata?.phone || "";
    profilePasswordInput.value = "";
    
    profileModal.classList.remove("hidden");
}

function closeProfileModal() {
    profileModal.classList.add("hidden");
}

closeProfileBtn.addEventListener("click", closeProfileModal);

window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
        closeProfileModal();
    }
});

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const newUsername = profileUsernameInput.value.trim();
    const newEmail = profileEmailInput.value.trim();
    const newPhone = profilePhone.value.trim();
    const newPassword = profilePasswordInput.value;
    
    const btn = profileForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Mise à jour...";
    
    try {
        if (newEmail !== currentUser.email) {
            const { error: emailError } = await supabaseClient.auth.updateUser({
                email: newEmail
            });
            if (emailError) throw emailError;
        }
        
        if (newPassword) {
            const { error: passwordError } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (passwordError) throw passwordError;
        }
        
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ username: newUsername, phone: newPhone })
            .eq('id', currentUser.id);
        
        if (profileError) {
            console.error('Profile update error:', profileError);
        }
        
        alert("Profil mis à jour avec succès !");
        location.reload();
        
    } catch (error) {
        alert("Erreur: " + error.message);
        btn.disabled = false;
        btn.textContent = "Mettre à jour";
    }
});

logoutBtn.addEventListener("click", logout);

// Post Image Preview
const postImageInput = document.getElementById("postImage");
const imageStatusText = document.getElementById("imageStatusText");

postImageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        imageStatusText.textContent = e.target.files[0].name;
    } else {
        imageStatusText.textContent = "Sélectionnez votre image";
    }
});

// Load Posts
async function loadPosts() {
    postsContainer.innerHTML = "<p style='text-align:center;color:var(--text-muted);'>Chargement des posts...</p>";
    
    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select(`
            *,
            profiles:user_id (username)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading posts:', error);
        loadTestPosts();
        return;
    }

    if (!posts || posts.length === 0) {
        loadTestPosts();
        return;
    }

    postsContainer.innerHTML = "";
    posts.forEach(post => {
        const postEl = document.createElement("div");
        postEl.classList.add("post-card");
        postEl.innerHTML = `
            <div class="post-header">
                <span class="post-owner">${post.profiles?.username || 'Utilisateur'}</span>
                <div class="post-date">${new Date(post.created_at).toLocaleDateString()} ${new Date(post.created_at).toLocaleTimeString()}</div>
            </div>
            <img src="${post.image_url}" class="post-image" alt="Post image" />
            <div class="post-caption">${post.caption || ''}</div>
        `;
        postsContainer.appendChild(postEl);
    });
}

function loadTestPosts() {
    postsContainer.innerHTML = "";
    testImages.forEach(imgPath => {
        const owner = randomNames[Math.floor(Math.random() * randomNames.length)];
        const caption = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
        const date = randomDate();

        const post = document.createElement("div");
        post.classList.add("post-card");
        post.innerHTML = `
            <div class="post-header">
                <span class="post-owner">${owner}</span>
                <div class="post-date">${date}</div>
            </div>
            <img src="${imgPath}" class="post-image" />
            <div class="post-caption">${caption}</div>
        `;
        postsContainer.appendChild(post);
    });
}

// Post Form Submission
postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const imageFile = document.getElementById("postImage").files[0];
    const caption = document.getElementById("postCaption").value;

    if (!imageFile) {
        alert("Veuillez sélectionner une image.");
        return;
    }

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

    document.getElementById("uploadStatus").textContent = "Téléchargement en cours...";
    document.getElementById("uploadStatus").style.color = "var(--primary-color)";

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('post-images')
        .upload(fileName, imageFile);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        alert("Erreur lors du téléchargement de l'image: " + uploadError.message);
        document.getElementById("uploadStatus").textContent = "";
        return;
    }

    const { data: urlData } = supabaseClient.storage
        .from('post-images')
        .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { data: postData, error: postError } = await supabaseClient
        .from('posts')
        .insert([{
            user_id: currentUser.id,
            image_url: imageUrl,
            caption: caption
        }])
        .select()
        .single();

    if (postError) {
        console.error('Post error:', postError);
        alert("Erreur lors de la publication: " + postError.message);
        document.getElementById("uploadStatus").textContent = "";
        return;
    }

    document.getElementById("uploadStatus").textContent = "Posté avec succès !";
    document.getElementById("uploadStatus").style.color = "green";
    
    setTimeout(() => {
        document.getElementById("uploadStatus").textContent = "";
        postForm.reset();
        imageStatusText.textContent = "Sélectionnez votre image";
        toggleForm();
        loadPosts();
    }, 1500);
});

// Check session on page load
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        currentProfile = await loadProfile(session.user.id);
        updateAuthButton(session.user, currentProfile);
        updatePostFormState();
        
        if (localStorage.getItem('justLoggedIn') === 'true') {
            localStorage.removeItem('justLoggedIn');
            postSection.classList.remove("hidden");
            toggleBtn.classList.add("hidden");
            postsContainer.classList.add("hidden");
        }
    }
    loadPosts();
}

checkUserSession();

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem('justLoggedIn');
        location.reload();
    }
});
