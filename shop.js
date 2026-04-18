import { supabaseUrl, supabaseKey } from './config.js';

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;
let isAdmin = false;
let products = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) {
        console.error('Supabase library not loaded!');
        return;
    }
    
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    
    await checkUserSession();
    initShop();
});

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        currentProfile = profile;
        isAdmin = profile?.is_admin || false;
    } else {
        isAdmin = false;
    }
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

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:9999;animation:fadeIn 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

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

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    await loadProducts();

    if (isAdmin) {
        showAdminPanel();
    }

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCount();
        showToast(`${product.name} ajouté au panier !`);
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        renderCart();
        updateCartCount();
    }

    function updateQuantity(productId, delta) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart();
                renderCart();
            }
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCount) cartCount.textContent = totalItems;
    }

    function calculateTotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
            cartTotalContainer.innerHTML = '';
            confirmOrderBtn.style.display = 'none';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${escapeHtml(item.name)}</span>
                        <span class="cart-item-price">${(item.price * item.quantity).toFixed(2)} TND</span>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">&times;</button>
                    </div>
                </div>
            `).join('');
            
            cartTotalContainer.innerHTML = `<div class="cart-total">Total: ${calculateTotal().toFixed(2)} TND</div>`;
            confirmOrderBtn.style.display = 'block';
        }
    }

    function confirmOrder() {
        if (cart.length === 0) return;
        alert(`Commande confirmée ! Total : ${calculateTotal().toFixed(2)} TND\nMerci pour votre commande !`);
        cart = [];
        saveCart();
        updateCartCount();
        renderCart();
        closeCart();
    }

    function openCart() {
        renderCart();
        cartModal.classList.remove('hidden');
    }

    function closeCart() {
        cartModal.classList.add('hidden');
    }
    
    cartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) closeCart();
    });
    confirmOrderBtn.addEventListener('click', confirmOrder);

    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;

    function showAdminPanel() {
        const main = document.querySelector('main');
        const adminSection = document.createElement('div');
        adminSection.id = 'admin-panel';
        adminSection.innerHTML = `
            <div class="admin-header">
                <h3>⚙️ Administration de la boutique</h3>
                <button id="toggleAdminForm" class="btn">+ Ajouter un produit</button>
            </div>
            <form id="addProductForm" class="admin-form hidden">
                <h4>Ajouter un nouveau produit</h4>
                <div class="form-group">
                    <label for="productName">Nom du produit</label>
                    <input type="text" id="productName" class="form-control" placeholder="Nom du produit" required>
                </div>
                <div class="form-group">
                    <label for="productCategory">Catégorie</label>
                    <select id="productCategory" class="form-control" required>
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
                    <label for="productImage">URL de l'image</label>
                    <input type="text" id="productImage" class="form-control" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Ajouter</button>
                    <button type="button" id="cancelAdminForm" class="btn btn-secondary">Annuler</button>
                </div>
            </form>
        `;
        main.insertBefore(adminSection, main.querySelector('.text-center'));
        
        document.getElementById('toggleAdminForm').addEventListener('click', () => {
            const form = document.getElementById('addProductForm');
            form.classList.toggle('hidden');
        });
        
        document.getElementById('cancelAdminForm').addEventListener('click', () => {
            document.getElementById('addProductForm').classList.add('hidden');
        });
        
        document.getElementById('addProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('productCategory').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const image = document.getElementById('productImage').value.trim();
            
            if (!name || !price) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            const { error } = await supabaseClient.from('products').insert([{
                name,
                category,
                price,
                image: image || null
            }]);
            
            if (error) {
                alert('Erreur: ' + error.message);
                return;
            }
            
            document.getElementById('addProductForm').classList.add('hidden');
            document.getElementById('addProductForm').reset();
            await loadProducts();
            renderProducts(products);
            showToast('Produit ajouté avec succès !');
        });
    }

    async function loadProducts() {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading products:', error);
            return;
        }
        
        products = data || [];
    }

    function renderProducts(filteredProducts) {
        shopGrid.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            shopGrid.innerHTML = '<p id="no-results">Aucun produit trouvé</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('article');
            card.className = 'card';
            const safeProduct = {
                name: escapeHtml(product.name),
                category: escapeHtml(product.category),
                price: product.price,
                image: product.image ? escapeAttr(product.image) : ''
            };
            card.innerHTML = `
                <div class="product-images-container">
                    ${product.image ? `<img src="${safeProduct.image}" alt="${safeProduct.name}" class="product-image" style="height: 200px; object-fit: contain; padding: 1rem; background: #f9f9f9;" loading="lazy" onerror="this.style.display='none'">` : '<div style="height:200px;display:flex;align-items:center;justify-content:center;background:#f9f9f9;">🐾</div>'}
                </div>
                <h3>${safeProduct.name}</h3>
                <p style="color: #666; font-size: 0.9rem;">${safeProduct.category}</p>
                <div class="product-price">${product.price.toFixed(2)} TND</div>
                <div class="product-actions">
                    <button class="btn" style="width: 100%;" data-product-id="${product.id}">Ajouter au panier</button>
                    ${isAdmin ? `<button class="btn btn-danger btn-small admin-delete-btn" data-id="${product.id}" data-name="${escapeAttr(product.name)}">🗑️</button>` : ''}
                </div>
            `;
            
            const btn = card.querySelector('button[data-product-id]');
            btn.addEventListener('click', () => addToCart(product));
            
            const deleteBtn = card.querySelector('.admin-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const name = decodeURIComponent(e.target.dataset.name);
                    if (!confirm(`Supprimer le produit "${name}" ?`)) return;
                    
                    const { error } = await supabaseClient.from('products').delete().eq('id', id);
                    if (error) {
                        alert('Erreur: ' + error.message);
                        return;
                    }
                    
                    await loadProducts();
                    renderProducts(products);
                    showToast('Produit supprimé');
                });
            }
            
            shopGrid.appendChild(card);
        });
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    });

    updateCartCount();
    renderProducts(products);
};
