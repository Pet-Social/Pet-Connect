document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('adoptionForm');
    const list = document.getElementById('adoptionList');
    const adoptionSection = document.getElementById('adoptionSection');
    const toggleBtn = document.getElementById('toggleAdoptionBtn');
    const cancelBtn = document.getElementById('cancelAdoptionBtn');
    
    const petTypeSelect = document.getElementById('petType');
    const vaxRadios = document.querySelectorAll('input[name="vaxStatus"]');
    const vaccineListContainer = document.getElementById('vaccineList');
    const dogVax = document.querySelectorAll('.dog-vax');
    const catVax = document.querySelectorAll('.cat-vax');

    // Load saved adoptions
    loadAdoptions();

    // --- Toggle Form Visibility ---
    function toggleForm() {
        const isHidden = adoptionSection.classList.contains('hidden');
        if (isHidden) {
            adoptionSection.classList.remove('hidden');
            toggleBtn.classList.add('hidden');
        } else {
            adoptionSection.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        }
    }

    toggleBtn.addEventListener('click', toggleForm);
    cancelBtn.addEventListener('click', toggleForm);

    // --- Vaccine List Logic ---
    vaxRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'Vaccinated') {
                vaccineListContainer.classList.remove('hidden');
            } else {
                vaccineListContainer.classList.add('hidden');
                document.querySelectorAll('input[name="vaccines"]').forEach(cb => cb.checked = false);
            }
        });
    });

    petTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'Dog') {
            dogVax.forEach(el => el.classList.remove('hidden'));
            catVax.forEach(el => el.classList.add('hidden'));
            catVax.forEach(el => {
                const cb = el.querySelector('input');
                if(cb) cb.checked = false;
            });
        } else {
            dogVax.forEach(el => el.classList.add('hidden'));
            catVax.forEach(el => el.classList.remove('hidden'));
             dogVax.forEach(el => {
                const cb = el.querySelector('input');
                if(cb) cb.checked = false;
            });
        }
    });

    // --- Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const name = document.getElementById('petName').value;
        const age = document.getElementById('petAge').value;
        const type = document.getElementById('petType').value;
        const phone = document.getElementById('contactPhone').value;
        const vaxStatus = document.querySelector('input[name="vaxStatus"]:checked').value;
        const fileInput = document.getElementById('petImage');

        // Get selected vaccines
        const selectedVaccines = [];
        if (vaxStatus === 'Vaccinated') {
            document.querySelectorAll('input[name="vaccines"]:checked').forEach(cb => {
                selectedVaccines.push(cb.value);
            });
        }

        try {
            // Image Handling
            let imageUrl = 'assets/icons/default-pet.svg'; // Fallback
            if (fileInput.files[0]) {
                imageUrl = await toBase64(fileInput.files[0]);
            }

            const newAdoption = {
                id: Date.now(),
                name,
                age,
                type,
                phone,
                vaxStatus,
                selectedVaccines,
                imageUrl
            };

            // Save and Render
            saveAdoption(newAdoption);
            renderAdoption(newAdoption);

            // Reset and Hide
            form.reset();
            vaccineListContainer.classList.add('hidden');
            document.getElementById('contactPhone').value = "+216"; 
            toggleForm();

        } catch (error) {
            console.error("Error processing adoption", error);
            alert("Failed to process image. It might be too large.");
        }
    });

    function saveAdoption(item) {
        const adoptions = JSON.parse(localStorage.getItem('adoptions') || '[]');
        adoptions.unshift(item); // Newest first
        
        // Limit to 20
        if (adoptions.length > 20) adoptions.pop();

        try {
            localStorage.setItem('adoptions', JSON.stringify(adoptions));
        } catch (e) {
            alert("Storage full! Oldest listings will be removed.");
             while (adoptions.length > 0) {
                adoptions.pop();
                try {
                    localStorage.setItem('adoptions', JSON.stringify(adoptions));
                    break;
                } catch (e) { continue; }
            }
        }
    }

    function loadAdoptions() {
        const adoptions = JSON.parse(localStorage.getItem('adoptions') || '[]');
        list.innerHTML = ''; // Clear current
        adoptions.forEach(item => {
            renderAdoption(item, true); // Append to end since sorted by date
        });
    }

    function clearAdoptions() {
        localStorage.removeItem('adoptions');
        list.innerHTML = '';
    }

    function renderAdoption(item, appendToEnd = false) {
        // Construct Vaccine Display Text
        let vaxDisplay = `<span style="color: #e74c3c;">Non vacciné</span>`;
        if (item.vaxStatus === 'Vaccinated') {
            if (item.selectedVaccines && item.selectedVaccines.length > 0) {
                vaxDisplay = `<span style="color: #27ae60;">Vacciné:</span> <br> <small>${item.selectedVaccines.join(', ')}</small>`;
            } else {
                vaxDisplay = `<span style="color: #27ae60;">Vacciné</span> (Non spécifié)`;
            }
        }

        // Create Card
        const card = document.createElement('article');
        card.className = 'card';

        card.innerHTML = `
            <img src="${item.imageUrl}" alt=" " class="adoption-image" style="height: 200px; object-fit: cover;">
            <h3 style="margin-bottom:0.5rem; color: var(--primary-color);">${item.name}</h3>
            <div style="font-size: 0.95rem; line-height: 1.6;">
                <p><strong>Type:</strong> ${item.type}</p>
                <p><strong>Âge:</strong> ${item.age} ans</p>
                <p style="margin-top: 0.5rem; background: var(--bg-color); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong>Statut:</strong> ${vaxDisplay}
                </p>
            </div>
            <a href="tel:${item.phone}" class="btn" style="margin-top: 1rem; width: 100%; text-decoration: none;">
                📞 Contacter le propriétaire
            </a>
        `;

        if (appendToEnd) {
            list.appendChild(card);
        } else {
            list.prepend(card);
        }
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    window.clearAdoptions = clearAdoptions;
});