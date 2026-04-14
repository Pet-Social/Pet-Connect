document.addEventListener('DOMContentLoaded', () => {
    const shopGrid = document.getElementById('shopGrid');

    const products = [
        {
            name: "Premium Dog Food",
            category: "Food",
            price: 29.99,
            image: "assets/icons/default-pet.svg" 
        },
        {
            name: "Squeaky Mouse Toy",
            category: "Toys",
            price: 5.99,
            image: "assets/icons/default-pet.svg"
        },
        {
            name: "Cat Scratching Post",
            category: "Toys",
            price: 45.00,
            image: "assets/icons/default-pet.svg"
        },
        {
            name: "Puppy Collar (Red)",
            category: "Accessories",
            price: 12.50,
            image: "assets/icons/default-pet.svg"
        },
        {
            name: "Organic Cat Treats",
            category: "Food",
            price: 8.99,
            image: "assets/icons/default-pet.svg"
        },
        {
            name: "Dog Bed (Large)",
            category: "Accessories",
            price: 59.99,
            image: "assets/icons/default-pet.svg"
        }
    ];

    products.forEach(product => {
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
});