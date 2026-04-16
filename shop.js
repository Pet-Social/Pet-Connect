document.addEventListener('DOMContentLoaded', () => {
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

    const products = [
        {
            name: "Premium Dog Food",
            category: "Nourriture",
            price: 29.99,
            image: "assets/images/product-icons/premium_food.jpeg"
        },
        {
            name: "Squeaky Mouse Toy",
            category: "Jouets",
            price: 5.99,
            image: "assets/images/product-icons/queaky Mouse Toy.jpeg"
        },
        {
            name: "Cat Scratching Post",
            category: "Jouets",
            price: 45.00,
            image: "assets/images/product-icons/Cat Scratching Post.jpeg"
        },
        {
            name: "Puppy Collar (multiple colors)",
            category: "Accessoires",
            price: 12.50,
            image: "assets/images/product-icons/Puppy Collar.jpeg"
        },
        {
            name: "Organic Cat Treats",
            category: "Nourriture",
            price: 8.99,
            image: "assets/images/product-icons/Organic Cat Treats.jpeg"
        },
        {
            name: "Dog Bed (Large)",
            category: "Accessoires",
            price: 59.99,
            image: "assets/images/product-icons/Dog Bed (Large).jpeg"
        },
        {
            name: "Catnip Mouse",
            category: "Jouets",
            price: 3.99,
            image: "assets/images/product-icons/Catnip Mouse.jpeg"
        },
        {
            name: "Leather Dog Leash",
            category: "Accessoires",
            price: 24.99,
            image: "assets/images/product-icons/Leather Dog Leash.jpeg"
        },
        {
            name: "Grain-Free Salmon Food",
            category: "Nourriture",
            price: 34.99,
            image: "assets/images/product-icons/Grain-Free Salmon Food.jpeg"
        },
        {
            name: "Interactive Laser Toy",
            category: "Jouets",
            price: 19.99,
            image: "assets/images/product-icons/Interactive Laser Toy.jpeg"
        },
        {
            name: "Cozy Cat Hamster Wheel",
            category: "Jouets",
            price: 39.99,
            image: "assets/images/product-icons/Cozy Cat Hamster Wheel.jpeg"
        },
        {
            name: "Stainless Steel Food Bowl",
            category: "Accessoires",
            price: 15.99,
            image: "assets/images/product-icons/Stainless Steel Food Bowl.jpeg"
        },
        {
            name: "Puppy Training Treats",
            category: "Nourriture",
            price: 12.99,
            image: "assets/images/product-icons/Puppy Training Treats.jpeg"
        },
        {
            name: "Adjustable Cat Collar",
            category: "Accessoires",
            price: 8.50,
            image: "assets/images/product-icons/Adjustable Cat Collar.jpeg"
        },
        {
            name: "Rope Tug Toy",
            category: "Jouets",
            price: 11.99,
            image: "assets/images/product-icons/Rope Tug Toy.jpeg"
        },
        {
            name: "Water Fountain (Pet)",
            category: "Accessoires",
            price: 49.99,
            image: "assets/images/product-icons/Water Fountain.jpeg"
        },
        {
            name: "Senior Dog Formula",
            category: "Nourriture",
            price: 38.99,
            image: "assets/images/product-icons/Senior Dog Formula.jpeg"
        },
        {
            name: "Feather Wand",
            category: "Jouets",
            price: 7.99,
            image: "assets/images/product-icons/Feather Wand.jpeg"
        }
    ];

    function addToCart(product) {
        const existingItem = cart.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCount();
        showToast(`${product.name} ajouté au panier !`);
    }

    function removeFromCart(productName) {
        cart = cart.filter(item => item.name !== productName);
        saveCart();
        renderCart();
        updateCartCount();
    }

    function updateQuantity(productName, delta) {
        const item = cart.find(item => item.name === productName);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productName);
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
        cartCount.textContent = totalItems;
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
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.name}')">&times;</button>
                    </div>
                </div>
            `).join('');
            
            cartTotalContainer.innerHTML = `<div class="cart-total">Total: $${calculateTotal().toFixed(2)}</div>`;
            confirmOrderBtn.style.display = 'block';
        }
    }

    function confirmOrder() {
        if (cart.length === 0) return;
        alert(`Commande confirmée ! Total : $${calculateTotal().toFixed(2)}`);
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

    function renderProducts(filteredProducts) {
        shopGrid.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            shopGrid.innerHTML = '<p id="no-results">Aucun produit trouvé</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="product-images-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image" style="height: 200px; object-fit: contain; padding: 1rem; background: #f9f9f9;">
                </div>
                <h3>${product.name}</h3>
                <p style="color: #666; font-size: 0.9rem;">${product.category}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="btn" style="width: 100%;" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})'>Add to Cart</button>
            `;
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
});
