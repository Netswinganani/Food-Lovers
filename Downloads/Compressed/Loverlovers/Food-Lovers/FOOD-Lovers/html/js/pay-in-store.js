import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { app } from './firebase.js'; // Ensure this imports your Firebase app correctly

const auth = getAuth(app);
const database = getDatabase(app);

// Function to show/hide loader
const toggleLoader = (isVisible) => {
    const loader = document.querySelector(".loader");
    loader.style.display = isVisible ? 'block' : 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirm-button').addEventListener('click', async () => {
        let user = JSON.parse(sessionStorage.getItem('user') || null);
        if (!user) {
            alert('No user found. Please sign in.');
            return;
        }
       
        toggleLoader(true); // Show loader
        try {
            const purchaseInfo = await getPurchaseInfo(user.uid);
            const amount = getCartTotal(purchaseInfo.cartItems);

            if (amount <= 0) {
                alert('Your cart is empty. Please add items to your cart before proceeding.');
                return;
            }

            const transactionId = generateTransactionId();
            const qrCodesRef = ref(database, `Users/${user.uid}/qrCodes`);

            // Check if a QR code already exists for this transaction
            const snapshot = await get(qrCodesRef);
            const existingCodes = snapshot.exists() ? snapshot.val() : {};
            if (Object.keys(existingCodes).some(code => code === transactionId)) {
                alert('A QR code has already been generated for this purchase.');
                return;
            }

            // Prepare QR code data
            const productDetails = Object.entries(purchaseInfo.cartItems).map(([key, item]) => ({
                name: item.name,
                price: item.sellPrice
            }));

            const qrCodeData = {
                transactionId,
                products: productDetails,
                totalAmount: amount,
            };

            // Save QR code data to Firebase
            await set(ref(database, `Users/${user.uid}/qrCodes/${transactionId}`), qrCodeData);

            // Generate QR Code
            const qrCodeElement = document.getElementById('qrcode');
            qrCodeElement.innerHTML = '';
            new QRCode(qrCodeElement, {
                text: JSON.stringify(qrCodeData),
                width: 128,
                height: 128,
            });

            alert('QR Code generated successfully!');
        } catch (error) {
            console.error('Error generating QR code:', error.message);
            alert('Error generating QR code: ' + error.message);
        } finally {
            toggleLoader(false); // Hide loader
        }
    });
});

// Function to fetch previously generated QR codes from Firebase
async function fetchPreviousQRCodes() {
    toggleLoader(true); // Show loader while fetching QR codes
    const user = JSON.parse(sessionStorage.getItem('user') || null);
    if (user && user.uid) {
        const qrCodesRef = ref(database, `Users/${user.uid}/qrCodes`);
        try {
            const snapshot = await get(qrCodesRef);
            const previousQRCodes = snapshot.exists() ? snapshot.val() : {};

            const qrCodesTableBody = document.getElementById('previous-qr-codes-body');
            qrCodesTableBody.innerHTML = ''; // Clear previous entries

            for (const key in previousQRCodes) {
                const qrCodeData = previousQRCodes[key];
                const row = document.createElement('tr');
                const transactionIdCell = document.createElement('td');
                const productsCell = document.createElement('td');
                const totalAmountCell = document.createElement('td');

                transactionIdCell.innerText = key; // Use the key as the transaction ID
                const productNames = qrCodeData.products.map(product => product.name).join(', ');
                productsCell.innerText = productNames;
                totalAmountCell.innerText = qrCodeData.approved ? 'Approved' : qrCodeData.totalAmount.toFixed(2);

                if (qrCodeData.approved) {
                    transactionIdCell.innerText = `${key} (Approved)`;
                } else {
                    // Display QR code if not approved
                    const qrCodeElement = document.createElement('div');
                    new QRCode(qrCodeElement, {
                        text: JSON.stringify(qrCodeData),
                        width: 128,
                        height: 128,
                    });
                    productsCell.appendChild(qrCodeElement);
                }

                row.appendChild(transactionIdCell);
                row.appendChild(productsCell);
                row.appendChild(totalAmountCell);
                qrCodesTableBody.appendChild(row);
            }
        } catch (error) {
            console.error('Error fetching QR codes:', error.message);
        }finally {
            toggleLoader(false); // Hide loader
        }
    } else {
        console.error('No user found. User might not be signed in.');
    } 
}

// Fetch QR codes on page load
$(document).ready(function() {
    fetchPreviousQRCodes(); // Fetch QR codes on page load
});

// Fetch purchase info from Firebase
async function getPurchaseInfo(userId) {
    try {
        const cartRef = ref(database, `Users/${userId}/cart`);
        const snapshot = await get(cartRef);
        const cartItems = snapshot.exists() ? snapshot.val() : {};
        console.log('Fetched cart items:', cartItems);
        return { cartItems };
    } catch (error) {
        console.error('Error fetching cart data:', error.message);
        return { cartItems: {} }; // Return empty cart on error
    }
}

// Get total cart amount
function getCartTotal(cartItems) {
    return Object.values(cartItems).reduce((total, item) => {
        return total + (Number(item.sellPrice) * (item.quantity || 0)); // Ensure quantity is handled
    }, 0);
}

// Generate a unique transaction ID
function generateTransactionId() {
    return Date.now().toString();
}
