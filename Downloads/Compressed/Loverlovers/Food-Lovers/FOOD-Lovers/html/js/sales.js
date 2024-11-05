import { getDatabase, ref, onValue, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { app } from './firebase.js';

const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const products = await fetchProducts();
        const paymentHistory = await fetchPaymentHistory();
        const totalSold = calculateTotalSold(paymentHistory);
        displayProductPerformance(products, totalSold);
        fetchPopularProducts();
        displayProducts(products, totalSold);
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Function to fetch products
const fetchProducts = async () => {
    return new Promise((resolve) => {
        const productRef = ref(db, 'products');
        onValue(productRef, (snapshot) => {
            const products = snapshot.val();
            if (products) {
                window.products = products; // Store products globally for filtering
                resolve(products); // Resolve with products
            } else {
                console.log('No products found');
                resolve({}); // Resolve with an empty object
            }
        }, (error) => {
            console.error('Error fetching products:', error);
            resolve({}); // Handle error by resolving with an empty object
        });
    });
};

// Function to fetch payment history
const fetchPaymentHistory = async () => {
    const paymentHistoryRef = ref(db, 'Users');
    const snapshot = await get(paymentHistoryRef);
    return snapshot.val(); // Return the entire payment history
};

// Calculate total sold from payment history
const calculateTotalSold = (paymentHistory) => {
    const productCounts = {};
    Object.values(paymentHistory).forEach(user => {
        if (user['payment-history']) {
            Object.values(user['payment-history']).forEach(payment => {
                const cartItems = payment.purchaseInfo?.cartItems || {};
                Object.values(cartItems).forEach(item => {
                    if (item.productId && item.quantity) {
                        productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
                    }
                });
            });
        }
    });
    return productCounts;
};

// Function to display product performance
const displayProductPerformance = (products, totalSold) => {
    const performanceContainer = document.getElementById('product-performance');
    performanceContainer.innerHTML = ''; // Clear previous content

    if (products) {
        Object.entries(products).forEach(([key, product]) => {
            const sellPrice = Number(product.sellPrice) || 0;
            const costPrice = Number(product.costPrice) || 0;
            const soldCount = totalSold[key] || 0;

            const profit = (sellPrice - costPrice) * soldCount;
            const loss = costPrice * soldCount;
            const breakEvenPoint = (sellPrice > costPrice) ? (costPrice / (sellPrice - costPrice)) : Infinity;

            performanceContainer.innerHTML += `
                <div class="product-item">
                    <h3>${product.name}</h3>
                    <p>Profit: R${profit.toFixed(2)}</p>
                    <p>Loss: R${loss.toFixed(2)}</p>
                    <p>Break-Even Point: ${isFinite(breakEvenPoint) ? breakEvenPoint.toFixed(2) : 'N/A'} units</p>
                </div>
            `;
        });
    } else {
        performanceContainer.innerHTML = '<p>No products found.</p>';
    }
};

// Display products with sold count
const displayProducts = (products, totalSold) => {
    const productList = document.querySelector('.product-list');
    if (!productList) {
        console.error('Product list container not found');
        return;
    }
    
    productList.innerHTML = ''; // Clear previous products

    Object.keys(products).forEach((key) => {
        const product = products[key];
        const soldCount = totalSold[key] || 0; // Total sold count for the product

        const sellPrice = Number(product.sellPrice) || 0;
        const costPrice = Number(product.costPrice) || 0;

        const profit = (sellPrice - costPrice) * soldCount;
        const loss = costPrice * soldCount;

        const productItem = document.createElement('div');
        productItem.className = 'product-item';

        productItem.innerHTML = `
            <div class="product-card">
                <h3>${product.name || 'Unnamed Product'}</h3>
                <p>Sold: ${soldCount} units</p>
                <p>Profit: R${profit.toFixed(2)}</p>
                <p>Loss: R${loss.toFixed(2)}</p>
                <p>Break-Even Point: ${isFinite(breakEvenPoint) ? breakEvenPoint.toFixed(2) : 'N/A'} units</p>
            </div>
        `;

        productList.appendChild(productItem);
    });
};

// Function to fetch popular products
const fetchPopularProducts = () => {
    const orderRef = ref(db, 'orders'); // Assuming orders are stored here
    onValue(orderRef, (snapshot) => {
        const orders = snapshot.val();
        displayPopularProducts(orders);
    });
};

// Function to display popular products
const displayPopularProducts = (orders) => {
    const popularContainer = document.getElementById('popular-products');
    popularContainer.innerHTML = ''; // Clear previous content

    if (orders) {
        const productCounts = {};
        Object.values(orders).forEach(order => {
            if (order.cartItems) {
                order.cartItems.forEach(item => {
                    productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
                });
            }
        });

        const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
        sortedProducts.slice(0, 5).forEach(([productId, count]) => {
            popularContainer.innerHTML += `
                <div class="popular-item">
                    <h4>Product ID: ${productId}</h4>
                    <p>Purchased: ${count} times</p>
                </div>
            `;
        });
    } else {
        popularContainer.innerHTML = '<p>No orders found.</p>';
    }
};
