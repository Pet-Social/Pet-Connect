import { supabaseUrl, supabaseKey } from './config.js';

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;
let isAdmin = false;
let products = [];
let cartMap = {};

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

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:9999;';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    setTimeout(() => toast.textContent = '', 3000);
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
}

function setupAuthHandlers() {
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModal');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
    if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
    
    if (loginTab) loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('hidden');
        if (signupForm) signupForm.classList.add('hidden');
    });
    
    if (signupTab) signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (signupForm) signupForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
    });
    
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        if (!email || !password) return alert('Remplissez tous les champs');
        btn.disabled = true; btn.textContent = 'Chargement...';
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        btn.disabled = false; btn.textContent = 'Se connecter';
        if (error) { alert(error.message.includes('Invalid') ? 'Email/mot de passe incorrect' : error.message); return; }
        closeAuthModal();
        await checkUserSession();
    });
    
    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const phone = document.getElementById('signupPhone').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const btn = signupForm.querySelector('button[type="submit"]');
        if (!name || !email || !password) return alert('Remplissez tous les champs');
        btn.disabled = true; btn.textContent = 'Chargement...';
        const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name, phone } } });
        btn.disabled = false; btn.textContent = "S'inscrire";
        if (error) { alert(error.message.includes('already') ? 'Email déjà utilisé' : error.message); return; }
        closeAuthModal();
        showToast('Compte créé ! Connectez-vous.');
    });
}

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
        currentProfile = profile;
        isAdmin = profile?.is_admin || false;
        await loadCartFromDB();
    } else {
        currentUser = null;
        isAdmin = false;
        cartMap = {};
    }
    updateCartCount();
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const total = Object.values(cartMap).reduce((sum, qty) => sum + qty, 0);
        cartCount.textContent = total;
    }
}

async function loadCartFromDB() {
    if (!currentUser) return;
    const { data } = await supabaseClient.from('cart_items').select('*').eq('user_id', currentUser.id);
    cartMap = {};
    if (data) data.forEach(item => { cartMap[item.product_id] = item.quantity; });
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) return console.error('Supabase not loaded!');
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    setupAuthHandlers();
    await checkUserSession();
    initShop();
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') { checkUserSession().then(() => loadCartFromDB()); }
        else if (event === 'SIGNED_OUT') { currentUser = null; isAdmin = false; cartMap = {}; updateCartCount(); }
    });
});

async function initShop() {
    const shopGrid = document.getElementById('shopGrid');
    const searchInput = document.getElementById('searchInput');
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const confirmOrderBtn = document.getElementById('confirm-order');

    await loadProducts();
    if (isAdmin) showAdminPanel();

    function getTotalQuantity() {
        return Object.values(cartMap).reduce((sum, qty) => sum + qty, 0);
    }

    async function addToCart(product) {
        if (!currentUser) { openAuthModal(); return; }
        const currentQty = cartMap[product.id] || 0;
        cartMap[product.id] = currentQty + 1;
        const { error } = await supabaseClient.from('cart_items').upsert(
            { user_id: currentUser.id, product_id: product.id, quantity: cartMap[product.id] },
            { onConflict: 'user_id,product_id' }
        );
        if (error) { console.error(error); cartMap[product.id] = currentQty; showToast('Erreur'); return; }
        updateCartCount();
        showToast(product.name + ' ajouté !');
    }

    async function removeFromCart(productId) {
        if (!currentUser) return;
        delete cartMap[productId];
        await supabaseClient.from('cart_items').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        updateCartCount();
    }

    async function updateQuantity(productId, delta) {
        if (!currentUser) return;
        const currentQty = cartMap[productId] || 0;
        const newQty = currentQty + delta;
        if (newQty <= 0) { 
            await removeFromCart(productId);
            renderCart();
            return; 
        }
        cartMap[productId] = newQty;
        await supabaseClient.from('cart_items').upsert(
            { user_id: currentUser.id, product_id: productId, quantity: newQty },
            { onConflict: 'user_id,product_id' }
        );
        updateCartCount();
        renderCart();
    }

    function calculateTotal() {
        let total = 0;
        Object.entries(cartMap).forEach(([pid, qty]) => {
            const p = products.find(x => x.id === pid);
            if (p) total += p.price * qty;
        });
        return total;
    }

    function renderCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalContainer = document.getElementById('cart-total');
        const confirmOrderBtn = document.getElementById('confirm-order');
        
        if (!currentUser) {
            cartItemsContainer.innerHTML = '<p class="cart-empty">Connectez-vous pour voir votre panier</p>';
            cartTotalContainer.innerHTML = '';
            if (confirmOrderBtn) confirmOrderBtn.style.display = 'none';
            return;
        }
        
        const items = Object.entries(cartMap).filter(([_, qty]) => qty > 0);
        if (items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty">Panier vide</p>';
            cartTotalContainer.innerHTML = '';
            if (confirmOrderBtn) confirmOrderBtn.style.display = 'none';
            return;
        }
        
        cartItemsContainer.innerHTML = items.map(([pid, qty]) => {
            const p = products.find(x => x.id === pid);
            if (!p) return '';
            return `<div class="cart-item">
                <div class="cart-item-info">
                    <span>${escapeHtml(p.name)}</span>
                    <span>${(p.price * qty).toFixed(2)} TND</span>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" data-id="${pid}" data-d="-1">-</button>
                    <span>${qty}</span>
                    <button class="qty-btn" data-id="${pid}" data-d="1">+</button>
                    <button class="rem-btn" data-id="${pid}">&times;</button>
                </div>
            </div>`;
        }).join('');
        
        cartTotalContainer.innerHTML = `<div class="cart-total">Total: ${calculateTotal().toFixed(2)} TND</div>`;
        if (confirmOrderBtn) confirmOrderBtn.style.display = 'block';
        
        document.querySelectorAll('.qty-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                const btn = e.target.closest('.qty-btn');
                if (!btn) return;
                const id = btn.getAttribute('data-id');
                const delta = parseInt(btn.getAttribute('data-d'));
                updateQuantity(id, delta);
            });
        });
        document.querySelectorAll('.rem-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeFromCart(id);
                renderCart();
            });
        });
    }

    async function confirmOrder() {
        if (!currentUser) { openAuthModal(); return; }
        if (Object.keys(cartMap).length === 0) return;
        if (!confirm(`Confirmer ${calculateTotal().toFixed(2)} TND ?`)) return;
        for (const pid of Object.keys(cartMap)) {
            await supabaseClient.from('cart_items').delete().eq('user_id', currentUser.id).eq('product_id', pid);
        }
        cartMap = {}; updateCartCount(); renderCart();
        alert('Merci pour votre commande !');
    }

    function openCart() { renderCart(); document.getElementById('cart-modal').classList.remove('hidden'); }
    function closeCart() { document.getElementById('cart-modal').classList.add('hidden'); }

    if (cartBtn) cartBtn.onclick = openCart;
    if (closeCartBtn) closeCartBtn.onclick = closeCart;
    document.getElementById('cart-modal').onclick = e => { if (e.target.id === 'cart-modal') closeCart(); };
    if (confirmOrderBtn) confirmOrderBtn.onclick = confirmOrder;

    window.addToCart = addToCart;

    function showAdminPanel() {
        const main = document.querySelector('main');
        if (document.getElementById('admin-panel')) return;
        const div = document.createElement('div');
        div.id = 'admin-panel';
        div.innerHTML = `<div class="admin-header"><h3>⚙️ Administration</h3><button id="toggleAdminForm" class="btn">+ Nouveau produit</button></div>
            <form id="addProductForm" class="admin-form hidden">
                <h4>Ajouter un produit</h4>
                <div class="form-group">
                    <label for="productName">Nom du produit</label>
                    <input type="text" id="productName" class="form-control" placeholder="Nom du produit" required>
                </div>
                <div class="form-group">
                    <label for="productCategory">Catégorie</label>
                    <select id="productCategory" class="form-control">
                        <option value="Nourriture">Nourriture</option>
                        <option value="Jouets">Jouets</option>
                        <option value="Accessoires">Accessoires</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="productPrice">Prix (TND)</label>
                    <input type="number" id="productPrice" class="form-control" step="0.01" min="0" placeholder="0.00" required>
                </div>
                <div class="form-group">
                    <label for="productImage">Image du produit</label>
                    <input type="file" id="productImage" class="form-control" accept="image/*">
                    <p id="uploadStatus" class="status-msg"></p>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Ajouter</button>
                    <button type="button" id="cancelAdminForm" class="btn btn-secondary">Annuler</button>
                </div>
            </form>`;
        main.insertBefore(div, main.firstChild);
        
        const form = document.getElementById('addProductForm');
        const fileInput = document.getElementById('productImage');
        const statusMsg = document.getElementById('uploadStatus');
        
        document.getElementById('toggleAdminForm').onclick = () => form.classList.toggle('hidden');
        document.getElementById('cancelAdminForm').onclick = () => { form.classList.add('hidden'); form.reset(); };
        
        form.onsubmit = async e => {
            e.preventDefault();
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const imageFile = fileInput.files[0];
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (!name || !price) return alert('Veuillez remplir tous les champs');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Chargement...';
            
            let imageUrl = null;
            
            if (imageFile) {
                statusMsg.textContent = 'Upload en cours...';
                const fileName = `products/${Date.now()}.${imageFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(fileName, imageFile);
                
                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    statusMsg.textContent = 'Erreur upload';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Ajouter';
                    return alert('Erreur lors de l\'upload: ' + uploadError.message);
                }
                
                const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
                statusMsg.textContent = 'Upload réussi !';
            }
            
            const { error } = await supabaseClient.from('products').insert([{ name, category, price, image: imageUrl }]);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Ajouter';
            
            if (error) {
                alert('Erreur: ' + error.message);
                return;
            }
            
            form.reset();
            statusMsg.textContent = '';
            form.classList.add('hidden');
            await loadProducts();
            renderProducts(products);
            showToast('Produit ajouté !');
        };
    }

    async function loadProducts() {
        const { data, error } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
        if (error) return console.error(error);
        products = data || [];
    }

    function renderProducts(filteredProducts) {
        shopGrid.innerHTML = '';
        if (filteredProducts.length === 0) return shopGrid.innerHTML = '<p>Aucun produit</p>';
        filteredProducts.forEach(p => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `<div class="product-images-container">
                ${p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeHtml(p.name)}" style="height:200px;object-fit:contain;padding:1rem;background:#f9f9f9;" onerror="this.style.display='none'">` : '<div style="height:200px;display:flex;align-items:center;justify-content:center;background:#f9f9f9;">🐾</div>'}
            </div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.category)}</p><div class="product-price">${p.price.toFixed(2)} TND</div>
                <div class="product-actions">
                    <button class="btn" style="width:100%;" data-product-id="${p.id}">Ajouter au panier</button>
                    ${isAdmin ? `<button class="btn btn-danger btn-small admin-delete-btn" data-id="${p.id}" data-name="${escapeAttr(p.name)}">🗑️</button>` : ''}
                </div>
            </div>`;
            card.querySelector('button[data-product-id]').onclick = () => addToCart(p);
            if (isAdmin) {
                card.querySelector('.admin-delete-btn').onclick = async e => {
                    if (!confirm('Supprimer ce produit ?')) return;
                    await supabaseClient.from('products').delete().eq('id', p.id);
                    await loadProducts();
                    renderProducts(products);
                    showToast('Produit supprimé');
                };
            }
            shopGrid.appendChild(card);
        });
    }

    searchInput.oninput = e => {
        const term = e.target.value.toLowerCase();
        renderProducts(products.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)));
    };

    updateCartCount();
    renderProducts(products);
}