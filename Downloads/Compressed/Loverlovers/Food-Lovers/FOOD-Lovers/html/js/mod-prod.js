import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js'; 
import { getDatabase, ref, set, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js'; 
import { storage, database } from './firebase.js';  // Import your Firebase configuration

const db = getDatabase();

const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const productList = document.querySelector('.product-list');

document.getElementById('add-product-btn').addEventListener('click', openModal);
closeModal.addEventListener('click', closeProductModal);
document.getElementById('submit-product-btn').addEventListener('click', addOrUpdateProduct);

let currentProductKey = null; // To track if we are updating an existing product

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
    const productData = {
        name: document.getElementById('product-name').value,
        shortDesc: document.getElementById('short-desc').value,
        description: document.getElementById('description').value,
        actualPrice: document.getElementById('actual-price').value,
        discount: document.getElementById('discount').value,
        sellPrice: document.getElementById('sell-price').value,
        stock: document.getElementById('stock').value,
        use: document.getElementById('use').value,
        cate: document.getElementById('cate').value,
        manuDate: document.getElementById('manuDate').value,
        exDate: document.getElementById('exDate').value,
        prescription: document.getElementById('prescription').value,
        images: [] // Initialize an empty array for images
    };
    const imageFiles = document.getElementById('image-input').files; // Assuming you have an input for images

    if (imageFiles.length > 0) {
        for (const file of imageFiles) {
            const storageRef = ref(storage, `images/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            productData.images.push(downloadURL); // Store the download URL in the images array
        }
    }

    try {
        // Save or update product data in Realtime Database
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


const fetchProducts = () => {
    const productRef = ref(db, 'products');
    productList.innerHTML = '<p>Loading products...</p>'; // Loading state
    onValue(productRef, (snapshot) => {
        const products = snapshot.val();
        displayProducts(products);
        checkStockLevels(products);
    });
};

// Function to check stock levels of products
const checkStockLevels = (products) => {
    const lowStockProducts = Object.keys(products).filter(productId => {
        return products[productId].stock < 5; // Check if stock is below 5
    });

    if (lowStockProducts.length > 0) {
        showStockAlert(`Warning: one or more product(s) Stock levels is low in your   Inventory`);
    } else {
        hideStockAlert();
    }
};

// Function to show stock alert banner
const showStockAlert = (message) => {
    const alertDiv = document.getElementById('stock-alert');
    const alertMessage = document.getElementById('stock-alert-message');
    alertMessage.textContent = message;
    alertDiv.style.display = 'block'; // Show the alert
};

// Function to hide stock alert banner
const hideStockAlert = () => {
    const alertDiv = document.getElementById('stock-alert');
    alertDiv.style.display = 'none'; // Hide the alert
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
            
             // Determine stock level class
             let stockClass = '';
             const stock = product.stock;
             if (stock < 5) {
                 stockClass = 'stock-low';
             } else if (stock < 15) {
                 stockClass = 'stock-warning';
             } else {
                 stockClass = 'stock-normal';
             }

            productItem.innerHTML = `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${productImage}" alt="${product.name}" />
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.shortDesc}</p>
                        <p><strong>Price:</strong> R${Number(product.sellPrice).toFixed(2)}</p>
                        <p class="${stockClass}"><strong>Stock:</strong> ${product.stock}</p>
                        <p><strong>Category:</strong> ${product.cate}</p>
                        <button class="modify-btn" onclick="openModal({ ...${JSON.stringify(product)}, key: '${key}' })">Modify</button>
                        <button class="delete-btn" onclick="deleteProduct('${key}')">Delete</button>
                    </div>
                </div>
            `;

            productList.appendChild(productItem);
        });

        // Add event listeners after appending items
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
        productList.innerHTML = '<p>No products found.</p>';
    }
};



// Delete product
const deleteProduct = async (key) => {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const productRef = ref(database, `products/${key}`);
            await remove(productRef);
            alert('Product deleted successfully!');
            fetchProducts(); // Refresh product list
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product!');
        }
    }
};

// Initialize the script
fetchProducts();
