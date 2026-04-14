import { supabaseUrl, supabaseKey } from './config.js';

// Initialize Supabase
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

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

//Elements
const postForm = document.getElementById("postForm");
const postSection = document.getElementById("postSection");
const toggleBtn = document.getElementById("togglePostBtn");
const cancelBtn = document.getElementById("cancelPostBtn");
const postsContainer = document.getElementById("postsContainer");

// Test images in the folder
const testImages = [
    "./assets/imagesfortest/anotherMoment.jpeg",
    "./assets/imagesfortest/BestMoment.jpeg",
    "./assets/imagesfortest/GoodBoy.jpeg",
    "./assets/imagesfortest/MyPet&MyChild.jpg",
    "./assets/imagesfortest/NatureWithMyPet.webp",

];

// Random names and descriptions
const randomNames = ["Alex", "Sam", "Lina", "Yassine", "Nour", "Karim", "Sophie", "Leo", "Maya", "Adam"];
const randomDescriptions = [
    "Regardez mon animal mignon !",
    "Moment adorable de la journée.",
    "Il fait une sieste paisible.",
    "Un moment drôle capturé !",
    "Journée ensoleillée pour mon ami."
];

// Generate random dates 
function randomDate() {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - Math.floor(Math.random() * 30));
    return past.toLocaleDateString() + " " + past.toLocaleTimeString();
}

// Masquer formumlaire
function toggleForm() {
    const isHidden = postSection.classList.contains("hidden");
    if (isHidden) {
        postSection.classList.remove("hidden");
        toggleBtn.classList.add("hidden");
        postsContainer.classList.add("hidden"); // hide posts when form shows
    } else {
        postSection.classList.add("hidden");
        toggleBtn.classList.remove("hidden");
        postsContainer.classList.remove("hidden"); // show posts when form hides
    }
}

toggleBtn.addEventListener("click", toggleForm);
cancelBtn.addEventListener("click", toggleForm);

function loadTestPosts() {
    postsContainer.innerHTML = "";
    testImages.forEach(imgPath => {
        const owner = randomNames[Math.floor(Math.random() * randomNames.length)];
        const caption = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
        const date = randomDate();

        const post = document.createElement("div");
        post.classList.add("post-card");
        post.innerHTML = `
            <div class="post-header">${owner} <div class="post-date">${date}</div></div>
            <img src="${imgPath}" class="post-image" />
            <div class="post-caption">${caption}</div>
        `;
        postsContainer.appendChild(post);
    });
}

function setupAuthModal() {
    const authModal = document.getElementById("authModal");
    const authBtn = document.getElementById("auth-btn");
    const closeAuthBtn = document.getElementById("closeAuthModal");
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    // Open modal
    authBtn.addEventListener("click", () => {
        authModal.classList.remove("hidden");
    });

    // Close modal
    closeAuthBtn.addEventListener("click", () => {
        authModal.classList.add("hidden");
    });

    // Close on click outside
    window.addEventListener("click", (e) => {
        if (e.target === authModal) {
            authModal.classList.add("hidden");
        }
    });

    // Switch tabs
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

    // Login Form Submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert("Erreur de connexion : " + error.message);
                return;
            }

            alert("Connexion réussie!");
            authModal.classList.add("hidden");
            // Optional: Update UI to show logged-in state
            updateUIForLoggedInUser(data.user);
        } catch (err) {
            console.error("Erreur inattendue:", err);
            alert("Une erreur est survenue lors de la connexion.");
        }
    });

    // Signup Form Submission
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value;
        const phone = document.getElementById("signupPhone").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                    }
                }
            });

            if (error) {
                alert("Erreur d'inscription : " + error.message);
                return;
            }

            alert("Compte créé avec succès ! Vous êtes maintenant connecté.");
            authModal.classList.add("hidden");
            // Automatically update UI since email confirmation is disabled
            updateUIForLoggedInUser(data.user);
        } catch (err) {
            console.error("Erreur inattendue:", err);
            alert("Une erreur est survenue lors de l'inscription.");
        }
    });
}

function updateUIForLoggedInUser(user) {
    if (user) {
        console.log("User logged in:", user.email);
        // You can update the header, show user profile icon, etc.
        // document.getElementById("auth-btn").innerHTML = "Déconnexion";
    }
}

// Check if user is already logged in on page load
async function checkUserSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (session) {
        updateUIForLoggedInUser(session.user);
    }
}

checkUserSession();

setupAuthModal();
loadTestPosts();
setupPostUpload();

// Function to handle image upload to Supabase Storage (S3 compatible)
function setupPostUpload() {
    if (!postForm) return;

    postForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById("postImage");
        const captionInput = document.getElementById("postCaption");
        const file = fileInput.files[0];
        const caption = captionInput.value;

        if (!file) {
            alert("Veuillez sélectionner une image.");
            return;
        }

        const uploadStatus = document.getElementById("uploadStatus");
        if (uploadStatus) {
            uploadStatus.textContent = "Téléchargement en cours...";
            uploadStatus.style.color = "blue";
        }

        try {
            // Generate a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `posts/${fileName}`; // Save in 'posts' folder

            // Ensure you have a bucket named 'images' in your Supabase Storage
            const { data, error } = await supabaseClient.storage
                .from('images')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            // Get the public URL for the uploaded image
            const { data: publicUrlData } = supabaseClient.storage
                .from('images')
                .getPublicUrl(filePath);

            const imageUrl = publicUrlData.publicUrl;

            if (uploadStatus) {
                uploadStatus.textContent = "Image publiée avec succès !";
                uploadStatus.style.color = "green";
            }

            // Add the new post dynamically to the UI
            const owner = "Moi (Maintenant)";
            const date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

            const post = document.createElement("div");
            post.classList.add("post-card");
            post.innerHTML = `
                <div class="post-header">${owner} <div class="post-date">${date}</div></div>
                <img src="${imageUrl}" class="post-image" />
                <div class="post-caption">${caption}</div>
            `;
            postsContainer.prepend(post);

            // Reset form and close
            postForm.reset();
            setTimeout(() => {
                if (uploadStatus) uploadStatus.textContent = "";
                toggleForm(); // Hide form and show posts
            }, 1500);

        } catch (error) {
            console.error("Erreur de téléchargement:", error.message);
            if (uploadStatus) {
                uploadStatus.textContent = "Erreur: " + error.message;
                uploadStatus.style.color = "red";
            } else {
                alert("Erreur: " + error.message);
            }
        }
    });
}
