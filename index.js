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

loadTestPosts();