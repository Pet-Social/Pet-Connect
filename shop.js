document.addEventListener('DOMContentLoaded', () => {
    const shopGrid = document.getElementById('shopGrid');

    const products = [
        {
            name: "Nourriture pour chiens Premium",
            category: "Nourriture",
            price: 29.99,
            image: "assets/images/food.jpg" 
        },
        {
            name: "Jouet Souris Couinante",
            category: "Jouets",
            price: 5.99,
            image: "assets/images/mouse-toy.jpg"
        },
        {
            name: "Griffoir pour chat",
            category: "Jouets",
            price: 45.00,
            image: "assets/images/griff.jpg"
        },
        {
            name: "Collier pour chiot (Rouge)",
            category: "Accessoires",
            price: 12.50,
            image: "assets/images/collier.jpg"
        },
        {
            name: "Friandises biologiques pour chats",
            category: "Nourriture",
            price: 8.99,
            image: "assets/images/cat-food.jpg"
        },
        {
            name: "Lit pour chien (Grand)",
            category: "Accessoires",
            price: 59.99,
            image: "assets/images/bed.jpg"
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
            <button class="btn" style="width: 100%;" onclick="alert('L\'achat n\'est pas disponible dans la démo')">Acheter maintenant</button>
        `;
        shopGrid.appendChild(card);
    });
});
