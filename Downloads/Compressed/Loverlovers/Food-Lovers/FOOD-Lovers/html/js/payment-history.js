import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { app } from './firebase.js'; // Ensure this path is correct

const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', async () => {
  const user = auth.currentUser || JSON.parse(sessionStorage.getItem('user'));

  if (!user || !user.uid) {
    console.error('No user found.');
    alert('No user found. Please sign in.');
    return;
  }

  try {
    console.log('Fetching payment history for user:', user.uid);
    const paymentHistoryRef = ref(database, `Users/${user.uid}/payment-history`);
    const snapshot = await get(paymentHistoryRef);

    if (snapshot.exists()) {
      const history = snapshot.val();
      displayPaymentHistory(history);
    } else {
      console.log('No payment history found for this user.');
      document.getElementById('payment-history').innerHTML = 'No payment history found.';
    }
  } catch (error) {
    console.error('Error fetching payment history:', error.message);
    alert('Error fetching payment history: ' + error.message);
  }
});

function displayPaymentHistory(history) {
  const historyContainer = document.getElementById('payment-history');
  if (!historyContainer) {
    console.error('Payment history container not found.');
    return;
  }

  historyContainer.innerHTML = '';

  // Convert history object to an array and sort by transaction date
  const sortedHistory = Object.entries(history).sort((a, b) => {
    const dateA = new Date(a[1].transactionDate || 0);
    const dateB = new Date(b[1].transactionDate || 0);
    return dateB - dateA; // Sort in descending order
  });

  for (const [transactionId, details] of sortedHistory) {
    let productsHtml = '';

    // Ensure purchaseInfo exists before accessing cartItems
    if (details.purchaseInfo && details.purchaseInfo.cartItems) {
      productsHtml = '<h4>Products Purchased:</h4><ul>';
      for (const [productId, product] of Object.entries(details.purchaseInfo.cartItems)) {
        productsHtml += `
          <li>
            <strong>${product.name}</strong><br>
            Quantity: ${product.quantity}<br>
            Price per unit: R${(product.sellPrice).toFixed(2)}<br>
            Total: R${(product.sellPrice * product.quantity).toFixed(2)}
          </li>
        `;
      }
      productsHtml += '</ul>';
    }

    // Check if transaction details are valid
    const amount = details.amount || 0; // Fallback to 0 if amount is not defined
    const paymentMethod = details.paymentMethod || 'N/A'; // Default to 'N/A' if not defined
    const transactionDate = details.transactionDate || 'Unknown Date'; // Fallback for transactionDate

    console.log(`Transaction ID: ${transactionId}, Amount: ${amount}, Transaction Date: ${transactionDate}`);

    historyContainer.innerHTML += `
      <div class="transaction">
        <div class="payment-info">
          <h3>Transaction ID: ${transactionId}</h3>
          <p>Payment Method: ${paymentMethod}</p>
          <p>Amount: R${amount.toFixed(2)}</p>
          <p>Transaction Date: ${transactionDate}</p>
        </div>
        <div class="products-info">
          ${productsHtml}
        </div>
      </div>
    `;
  }
}
