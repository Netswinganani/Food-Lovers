import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { app } from './firebase.js';

const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  const paymentMethodRadio = document.querySelectorAll('input[name="payment-method"]');

  paymentMethodRadio.forEach(radio => {
    radio.addEventListener('change', () => {
      const isCredit = document.getElementById('payment-method-credit').checked;
      document.getElementById('credit-card-info').style.display = isCredit ? 'block' : 'none';
      document.getElementById('paypal-info').style.display = isCredit ? 'none' : 'block';
    });
  });

  // Add event listener for formatting card number input
  document.getElementById('card-number').addEventListener('input', formatCardNumber);
});

document.getElementById('payment-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user || !user.uid) {
    alert('No user found. Please sign in.');
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

  if (paymentMethod === 'credit' && !validateCardDetails()) return; // Validate card details

  try {
    const purchaseInfo = await getPurchaseInfo(user.uid); // Include cart details
    const amount = getCartTotal(purchaseInfo.cartItems); // Total amount from cart

    if (amount <= 0) {
      alert('Your cart is empty. Please add items to your cart before proceeding to payment.');
      return;
    }

    // Payment details object
    const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, ''); // Get card number without spaces
    const expirationDate = document.getElementById('expiration-date').value; // Get expiration date
    const cvv = document.getElementById('cvv').value; // Get CVV
    const cardholderName = document.getElementById('cardholder-name').value; // Get cardholder name

    const paymentDetails = {
      paymentMethod,
      transactionDate: new Date().toISOString().split('T')[0],
      cardNumber,
      expirationDate,
      amount,
      cvv,
      cardholderName,
      purchaseInfo
    };

    const transactionId = generateTransactionId();

    await set(ref(database, `Users/${user.uid}/payment-history/${transactionId}`), {
      paymentMethod: paymentDetails.paymentMethod,
      transactionDate: paymentDetails.transactionDate,
      amount: paymentDetails.amount,
      cvv: paymentDetails.cvv,
      cardholderName: paymentDetails.cardholderName,
      expirationDate: paymentDetails.expirationDate,
      purchaseInfo: paymentDetails.purchaseInfo
    });

    // Create order in orders table
    await set(ref(database, `orders/${transactionId}`), {
      userId: user.uid,
      paymentMethod: paymentDetails.paymentMethod,
      transactionDate: paymentDetails.transactionDate,
      amount: paymentDetails.amount,
      purchaseInfo: paymentDetails.purchaseInfo
    });

    await decreaseStock(purchaseInfo.cartItems); // Update stock based on purchased items
    clearCart(); // Clear the cart after successful payment
    alert('Payment processed successfully!');

    // Redirect to payment-history.html
    window.location.href = 'payment-history.html';
  } catch (error) {
    console.error('Error processing payment:', error.message);
    alert('Error processing payment: ' + error.message);
  }
});

// Validate card details
function validateCardDetails() {
  const cardNumber = document.getElementById('card-number').value;
  const expirationDate = document.getElementById('expiration-date').value;
  const cvv = document.getElementById('cvv').value;

  if (!validateCardNumber(cardNumber)) {
    alert('Invalid card number. Please check the number and try again.');
    return false;
  }

  if (!validateExpirationDate(expirationDate)) {
    alert('Invalid expiration date.');
    return false;
  }

  if (!validateCVV(cvv)) {
    alert('Invalid CVV. Please check the CVV and try again.');
    return false;
  }

  return true; // All validations passed
}

// Function to format card number input
function formatCardNumber(event) {
  const input = event.target;
  const value = input.value.replace(/\D/g, ''); // Remove non-digit characters
  const formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
  input.value = formattedValue.trim(); // Update input value with formatted value
}

// Validate card number using Luhn algorithm
function validateCardNumber(cardNumber) {
  cardNumber = cardNumber.replace(/\s+/g, '');
  const isAllDigits = /^\d+$/.test(cardNumber);
  if (!isAllDigits || cardNumber.length < 13 || cardNumber.length > 19) {
    return false; 
  }

  let sum = 0;
  let alternate = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cardNumber.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// Validate expiration date (MM/YY)
function validateExpirationDate(expirationDate) {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  if (!regex.test(expirationDate)) {
    return false;
  }

  const [month, year] = expirationDate.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last two digits of the current year
  const currentMonth = now.getMonth() + 1; // Note: getMonth() returns 0-11

  return (year > currentYear || (year === currentYear && month >= currentMonth));
}

// Validate CVV
function validateCVV(cvv) {
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
}

// Generate a unique transaction ID
function generateTransactionId() {
  return Date.now().toString();
}

// Fetch purchase info from Firebase
async function getPurchaseInfo(userId) {
  try {
    const cartRef = ref(database, `Users/${userId}/cart`);
    const snapshot = await get(cartRef);
    const cartItems = snapshot.exists() ? snapshot.val() : {}; // Use empty object if cart doesn't exist
    console.log('Fetched cart items:', cartItems); // Log fetched items
    return { cartItems }; // Return cart items wrapped in an object
  } catch (error) {
    console.error('Error fetching cart data:', error.message);
    return { cartItems: {} }; // Return empty cart on error
  }
}

// Get total cart amount
function getCartTotal(cartItems) {
  return Object.values(cartItems).reduce((total, item) => total + (Number(item.sellPrice) * item.quantity), 0);
}

// Decrease stock function
async function decreaseStock(cartItems) {
  for (const itemId in cartItems) {
    const item = cartItems[itemId];
    const stockRef = ref(database, `products/${itemId}/stock`);

    try {
      // Get current stock before updating
      const currentStockSnapshot = await get(stockRef);
      const currentStock = currentStockSnapshot.exists() ? parseInt(currentStockSnapshot.val(), 10) : 0; // Ensure it's an integer

      // Ensure there is enough stock
      if (currentStock >= item.quantity) {
        const newStock = currentStock - item.quantity; // Calculate new stock
        await set(stockRef, newStock); // Update stock in the database
        console.log(`Updated stock for ${item.name}: ${newStock}`);
      } else {
        alert(`Insufficient stock for item ${item.name}.`);
      }
    } catch (error) {
      console.error(`Error updating stock for item ${itemId}:`, error.message);
    }
  }
}

// Clear the cart function
function clearCart() {
  const user = auth.currentUser;
  if (user && user.uid) {
    const cartRef = ref(database, `Users/${user.uid}/cart`);
    set(cartRef, {}); // Clear cart in Firebase
  }
}
