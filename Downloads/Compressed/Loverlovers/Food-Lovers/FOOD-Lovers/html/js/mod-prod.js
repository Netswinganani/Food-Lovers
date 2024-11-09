// Import necessary Firebase functions
import { getDatabase, ref, set, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';
import { storage, database } from './firebase.js'; // Assuming your Firebase initialization is in firebase.js

// DOM Elements
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const productList = document.querySelector('.product-list');
const addProductBtn = document.getElementById('add-product-btn');

let currentProductKey = null; // To track if we are updating an existing product

// Event Listeners
addProductBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeProductModal);
document.getElementById('submit-product-btn').addEventListener('click', addOrUpdateProduct);

// Open modal for adding/updating product
function openModal(product = null) {
    productModal.style.display = 'block';
    if (product) {
        document.getElementById('modal-title').innerText = 'Update Product';
        fillProductForm(product);
        currentProductKey = product.key; // Save product key for updating
    } else {
        clearProductForm();
        document.getElementById('modal-title').innerText = 'Add Product';
        currentProductKey = null; // Reset for new product
    }
}

// Close modal
function closeProductModal() {
    productModal.style.display = 'none';
}

// Fill form with product data
function fillProductForm(product) {
    document.getElementById('product-name').value = product.name;
    document.getElementById('short-desc').value = product.shortDesc;
    document.getElementById('description').value = product.description;
    document.getElementById('actual-price').value = product.actualPrice;
    document.getElementById('discount').value = product.discount;
    document.getElementById('sell-price').value = product.sellPrice;
    document.getElementById('stock').value = product.stock;
    document.getElementById('use').value = product.use;
    document.getElementById('cate').value = product.cate;
    document.getElementById('manuDate').value = product.manuDate;
    document.getElementById('exDate').value = product.exDate;
    document.getElementById('prescription').value = product.prescription;
}

// Clear form for new product
function clearProductForm() {
    document.getElementById('product-name').value = '';
    document.getElementById('short-desc').value = '';
    document.getElementById('description').value = '';
    document.getElementById('actual-price').value = '';
    document.getElementById('discount').value = '';
    document.getElementById('sell-price').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('use').value = '';
    document.getElementById('cate').value = '';
    document.getElementById('manuDate').value = '';
    document.getElementById('exDate').value = '';
    document.getElementById('prescription').value = '';
}

// Add or update product
async function addOrUpdateProduct() {
    const productName = document.getElementById('product-name').value;
    const shortDesc = document.getElementById('short-desc').value;
    const description = document.getElementById('description').value;
    const actualPrice = parseFloat(document.getElementById('actual-price').value);
    const discount = parseFloat(document.getElementById('discount').value);
    const sellPrice = parseFloat(document.getElementById('sell-price').value);
    const stock = parseInt(document.getElementById('stock').value, 10);
    const use = document.getElementById('use').value;
    const cate = document.getElementById('cate').value;
    const manuDate = document.getElementById('manuDate').value;
    const exDate = document.getElementById('exDate').value;
    const prescription = document.getElementById('prescription').value;

    // Validate the discount and actual price
    const calculatedActualPrice = calculateActualPrice(sellPrice, discount);
    if (actualPrice !== calculatedActualPrice) {
        alert(`Actual price should be R${calculatedActualPrice.toFixed(2)} based on the discount.`);
        return;
    }

    const imageInputs = [
        document.getElementById('link-img-1'),
        document.getElementById('link-img-2'),
        document.getElementById('link-img-3'),
        document.getElementById('link-img-4')
    ];

    // Initialize an array to hold image URLs
    let imageUrls = [];

    try {
        // Upload new images if any
        for (const input of imageInputs) {
            if (input.files.length > 0) {
                const file = input.files[0];
                const fileName = `${Date.now()}_${file.name}`; // Create a unique file name
                const fileRef = storageRef(storage, `images/${fileName}`);
                await uploadBytes(fileRef, file);
                const downloadURL = await getDownloadURL(fileRef);
                imageUrls.push(downloadURL); // Capture image URLs
            }
        }

        // Construct product data
        const productData = {
            name: productName,
            shortDesc: shortDesc,
            description: description,
            images: imageUrls, // Add image URLs if any
            actualPrice: calculatedActualPrice,
            discount: discount,
            sellPrice: sellPrice,
            stock: stock,
            use: use,
            cate: cate,
            manuDate: manuDate,
            exDate: exDate,
            prescription: prescription
        };

        // Save or update product data
        const productRef = ref(database, 'products/' + (currentProductKey ? currentProductKey : Date.now()));
        await set(productRef, productData);
        alert(currentProductKey ? 'Product updated successfully!' : 'Product added successfully!');
        closeProductModal();
        currentProductKey = null; // Reset for future use
        fetchProducts(); // Refresh product list
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product!');
    }
}

// Calculate the actual price based on the sell price and discount
function calculateActualPrice(sellPrice, discount) {
    return sellPrice - (sellPrice * (discount / 100));
}

// Fetch products from the database
const fetchProducts = () => {
    const productRef = ref(database, 'products');
    productList.innerHTML = '<p>Loading products...</p>'; // Loading state
    onValue(productRef, (snapshot) => {
        const products = snapshot.val();
        displayProducts(products);
    });
};

// Display products on the page
const displayProducts = (products) => {
    productList.innerHTML = ''; // Clear previous products
    if (products) {
        Object.keys(products).forEach(key => {
            const product = products[key];
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            const productImage = (product.images && product.images.length > 0) ? product.images[0] : 'images/noimg.jpg';

            productItem.innerHTML = `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${productImage}" alt="${product.name}" />
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.shortDesc}</p>
                        <p><strong>Price:</strong> R${Number(product.sellPrice).toFixed(2)}</p>
                        <p><strong>Stock:</strong> ${product.stock}</p>
                        <button class="modify-btn" data-key="${key}">Modify</button>
                        <button class="delete-btn" data-key="${key}">Delete</button>
                    </div>
                </div>
            `;

            productList.appendChild(productItem);
        });

        // Add event listeners for modify and delete buttons
        document.querySelectorAll('.modify-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                openModal({ ...products[key], key });
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                deleteProduct(key);
            });
        });
    } else {
        productList.innerHTML = '<p>No products available.</p>';
    }
};

// Delete a product
async function deleteProduct(key) {
    const productRef = ref(database, 'products/' + key);
    try {
        await remove(productRef);
        alert('Product deleted successfully!');
        fetchProducts(); // Refresh product list
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product!');
    }
}

// Initial fetch
fetchProducts();
