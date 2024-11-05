import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { app } from './firebase.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js';

const auth = getAuth(app);
const database = getDatabase(app);

// Function to validate the current admin user
async function validateAdminUser() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const adminRef = ref(database, `Admins/${user.uid}`);
                    const snapshot = await get(adminRef);
                    
                    if (snapshot.exists()) {
                        const adminData = snapshot.val();
                        console.log("Admin Data:", adminData);

                        if (adminData.role === 'admin') {
                            resolve(user);
                        } else {
                            alert('You do not have admin access.');
                            reject('User is not an admin');
                            console.error("User does not have admin role");
                        }
                    } else {
                        alert('User is not found in Admins table.');
                        console.error("User is not an admin");
                        reject('User not found');
                    }
                } catch (error) {
                    console.error('Error checking admin role:', error);
                    alert('Error checking admin role. Check console for details.');
                    reject(error);
                }
            } else {
                alert('Admin user is not authenticated. Please sign in.');
                reject('Admin not authenticated');
            }
        });
    });
}

async function fetchPendingPurchases() {
    const qrCodesRef = ref(database, `Users`);
    const snapshot = await get(qrCodesRef);
    const users = snapshot.val();

    const pendingPurchases = [];
    for (const userId in users) {
        const qrCodes = users[userId].qrCodes;
        if (qrCodes) {
            for (const key in qrCodes) {
                const qrCode = qrCodes[key];
                // Include the user's email or name who made the QR code
                pendingPurchases.push({ userId, transactionId: key, ...qrCode, userName: users[userId].name, userEmail: users[userId].email });
            }
        }
    }
    return pendingPurchases;
}

window.approvePurchase = async function(userId, transactionId) {
    const qrCodesRef = ref(database, `Users/${userId}/qrCodes/${transactionId}`);
    
    try {
        const qrCodeDataSnapshot = await get(qrCodesRef);
        const qrCodeData = qrCodeDataSnapshot.val();

        if (!qrCodeData) {
            alert('QR Code data not found.');
            return;
        }

        // Move to payment history
        await set(ref(database, `Users/${userId}/payment-history/${transactionId}`), {
            ...qrCodeData,
            userId,
            approved: true,
            amount: qrCodeData.totalAmount, // Assuming totalAmount is defined in qrCodeData
            transactionDate: new Date().toISOString(), // Store the current date
            paymentMethod: 'pay in store' // Set payment method
        });

        // Remove the QR code from the user's data
        await set(qrCodesRef, null); // Deletes the QR code entry

        alert(`Purchase approved for transaction ID: ${transactionId}`);
    } catch (error) {
        console.error('Error approving purchase:', error);
        alert('Error approving purchase: ' + error.message);
    }
};

async function loadPendingPurchases() {
    const purchases = await fetchPendingPurchases();
    const tableBody = document.getElementById('pending-purchases-body');
    tableBody.innerHTML = '';

    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${purchase.transactionId}</td>
            <td>${purchase.totalAmount}</td>
            <td>${purchase.userName} (${purchase.userEmail})</td> <!-- Show user name and email -->
            <td><button onclick="approvePurchase('${purchase.userId}', '${purchase.transactionId}')">Approve</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Validate admin user and then load pending purchases
validateAdminUser()
    .then(() => loadPendingPurchases())
    .catch(error => console.error(error));
