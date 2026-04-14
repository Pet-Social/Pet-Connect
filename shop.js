document.addEventListener('DOMContentLoaded', () => {
    const shopGrid = document.getElementById('shopGrid');
    const searchInput = document.getElementById('searchInput');

    const products = [
        {
            name: "Premium Dog Food",
            category: "Food",
            price: 29.99,
            image: "assets/images/product-icons/premium_food.jpeg"
        },
        {
            name: "Squeaky Mouse Toy",
            category: "Toys",
            price: 5.99,
            image: "assets/images/product-icons/queaky Mouse Toy.jpeg"
        },
        {
            name: "Cat Scratching Post",
            category: "Toys",
            price: 45.00,
            image: "assets/images/product-icons/Cat Scratching Post.jpeg"
        },
        {
            name: "Puppy Collar (multiple colors)",
            category: "Accessories",
            price: 12.50,
            image: "assets/images/product-icons/Puppy Collar.jpeg"
        },
        {
            name: "Organic Cat Treats",
            category: "Food",
            price: 8.99,
            image: "assets/images/product-icons/Organic Cat Treats.jpeg"
        },
        {
            name: "Dog Bed (Large)",
            category: "Accessories",
            price: 59.99,
            image: "assets/images/product-icons/Dog Bed (Large).jpeg"
        },
        {
            name: "Catnip Mouse",
            category: "Toys",
            price: 3.99,
            image: "assets/images/product-icons/Catnip Mouse.jpeg"
        },
        {
            name: "Leather Dog Leash",
            category: "Accessories",
            price: 24.99,
            image: "assets/images/product-icons/Leather Dog Leash.jpeg"
        },
        {
            name: "Grain-Free Salmon Food",
            category: "Food",
            price: 34.99,
            image: "assets/images/product-icons/Grain-Free Salmon Food.jpeg"
        },
        {
            name: "Interactive Laser Toy",
            category: "Toys",
            price: 19.99,
            image: "assets/images/product-icons/Interactive Laser Toy.jpeg"
        },
        {
            name: "Cozy Cat Hamster Wheel",
            category: "Toys",
            price: 39.99,
            image: "assets/images/product-icons/Cozy Cat Hamster Wheel.jpeg"
        },
        {
            name: "Stainless Steel Food Bowl",
            category: "Accessories",
            price: 15.99,
            image: "assets/images/product-icons/Stainless Steel Food Bowl.jpeg"
        },
        {
            name: "Puppy Training Treats",
            category: "Food",
            price: 12.99,
            image: "assets/images/product-icons/Puppy Training Treats.jpeg"
        },
        {
            name: "Adjustable Cat Collar",
            category: "Accessories",
            price: 8.50,
            image: "assets/images/product-icons/Adjustable Cat Collar.jpeg"
        },
        {
            name: "Rope Tug Toy",
            category: "Toys",
            price: 11.99,
            image: "assets/images/product-icons/Rope Tug Toy.jpeg"
        },
        {
            name: "Water Fountain (Pet)",
            category: "Accessories",
            price: 49.99,
            image: "assets/images/product-icons/Water Fountain.jpeg"
        },
        {
            name: "Senior Dog Formula",
            category: "Food",
            price: 38.99,
            image: "assets/images/product-icons/Senior Dog Formula.jpeg"
        },
        {
            name: "Feather Wand",
            category: "Toys",
            price: 7.99,
            image: "assets/images/product-icons/Feather Wand.jpeg"
        }
    ];

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
                <img src="${product.image}" alt="${product.name}" class="product-image" style="height: 200px; object-fit: contain; padding: 1rem; background: #f9f9f9;">
                <h3>${product.name}</h3>
                <p style="color: #666; font-size: 0.9rem;">${product.category}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="btn" style="width: 100%;" onclick="alert('Purchasing not available in demo')">Buy Now</button>
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

    renderProducts(products);
});