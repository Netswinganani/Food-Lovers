import { database, ref, get } from './firebase.js'; // Ensure this imports the necessary functions from firebase.js

document.addEventListener('DOMContentLoaded', () => {
const loader = document.querySelector(".loader");
const categoryInput = document.getElementById("banner-category");
const form = document.getElementById('banner-edit-form');

if (!form) {
    console.error('Banner edit form not found');
    return;
}

// Handle form submission
form.addEventListener('submit', function(event) {
    event.preventDefault();

    let bannerMessage = document.getElementById('banner-message').value;
    let bannerCategory = document.getElementById('banner-category').value;

    // Store the banner information in local storage
    localStorage.setItem('bannerMessage', bannerMessage);
    localStorage.setItem('bannerCategory', bannerCategory);

    alert('Banner updated successfully!');
});

// Function to fetch categories based on the search input
const fetchCategories = async (searchKey) => {
    try {
        const productsSnapshot = await get(ref(database, 'products'));
        const products = productsSnapshot.val();
        
        const productArray = products ? Object.values(products) : [];
        const categories = [...new Set(productArray.map(product => product.cate))]; // Get unique categories

        const filteredCategories = categories.filter(category => category.toLowerCase().includes(searchKey.toLowerCase()));

        return filteredCategories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};
const fetchProductsByCategory = async (category) => {
    const productRef = ref(db, 'products'); // Reference to your Firebase products
    onValue(productRef, (snapshot) => {
        const products = snapshot.val();
        if (products) {
            // Filter products by category
            const filteredProducts = Object.values(products).filter(product => product.cate === category);
            displayProducts(filteredProducts); // Call to display the filtered products
        } else {
            console.log('No products found.');
            displayProducts([]); // Handle no products case
        }
    });
};
const displayProducts = (products) => {
    const productsContainer = document.getElementById('products-container'); // Ensure you have this element in your HTML
    productsContainer.innerHTML = ''; // Clear previous products

    if (products.length === 0) {
        productsContainer.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image1 || 'images/noimg.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.shortDesc}</p>
            <span>R${product.sellPrice}</span>
            <button>Add to Cart</button>
        `;
        productsContainer.appendChild(productCard);
    });
};


// Event listener for category input
categoryInput.addEventListener("input", async () => {
    const searchKey = categoryInput.value.trim();
    if (searchKey) {
        loader.style.display = "block"; // Show loader
        const categories = await fetchCategories(searchKey);
        loader.style.display = "none"; // Hide loader

        // Display the categories (you may want to append these to a dropdown or similar)
        console.log("Filtered categories:", categories);
        // Optionally update the UI with categories
    }
});
});
