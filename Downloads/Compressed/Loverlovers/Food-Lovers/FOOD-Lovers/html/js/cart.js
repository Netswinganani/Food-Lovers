import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';

const db = getDatabase();

// Function to get the currently logged-in user
const getCurrentUser = () => {
  return JSON.parse(sessionStorage.getItem('user'));
};

// Function to show/hide loader
const toggleLoader = (isVisible) => {
  const loader = document.querySelector(".loader");
 
  loader.style.display = isVisible ? 'block' : 'none';
};


// Function to get cart from Firebase for the current user
const getCartFromFirebase = async () => {
  const user = getCurrentUser();
  if (!user) return {};

  toggleLoader(true); // Show loader

    try {

  const cartRef = ref(db, `Users/${user.uid}/cart`);
  const snapshot = await get(cartRef);
  const cart = snapshot.val() || {};
  
  console.log('Fetched cart:', cart); // Log the fetched cart
  return cart;
} catch (error) {
  console.error('Error fetching cart:', error);
  showAlert('Error fetching cart. Please try again.');
  return {};
  
} finally {
  toggleLoader(false); // Hide loader
}
  
};

// Function to save cart to Firebase
const saveCartToFirebase = async (cart) => {
  const user = getCurrentUser();
  if (!user) return;

  const cartRef = ref(db, `Users/${user.uid}/cart`);
  await set(cartRef, cart);
  console.log('Cart saved to Firebase:', cart); // Log the saved cart
};

// Function to show alert messages
const showAlert = (message) => {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert success-alert';
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
};

// Function to add product to cart
const addToCart = async (product) => {
  console.log('Product being added to cart:', product);
  const cart = await getCartFromFirebase();
  const productId = product.id; // Use a unique identifier for each product
 
  // Ensure sellPrice and discount are numbers
  const sellPrice = Number(product.sellPrice) || 0;
  const discount = Number(product.discount) || 0; // Extract discount
  const discountedPrice = sellPrice - (sellPrice * (discount / 100)); // Calculate the discounted price

  if (cart[productId]) {
    cart[productId].quantity += 1; // Increase quantity if product is already in the cart
  } else {
    cart[productId] = { 
      ...product, 
      sellPrice, // Original sell price
      discountedPrice: discountedPrice < 0 ? 0 : discountedPrice, // Ensure non-negative discounted price
      quantity: 1 
    }; 
  }
  console.log('Updated cart:', cart);
  await saveCartToFirebase(cart);
  renderCart(cart); // Re-render the cart

  showAlert(`${product.name} has been added to your cart!`);
};

// Function to render cart
const renderCart = async () => {
  toggleLoader(true); // Show loader while rendering cart
  const cart = await getCartFromFirebase();
  const cartElement = document.getElementById('cart-body');
  
  if (!cartElement) {
    console.error('Cart element not found');
    toggleLoader(false); // Hide loader if cart element is not found
    return;
  }
  
  cartElement.innerHTML = ''; // Clear previous content
  let total = 0;
  let totalDiscount = 0;

  Object.keys(cart).forEach(productId => {
    const item = cart[productId];

    // Ensure item properties are valid numbers
    const itemSellPrice = Number(item.sellPrice) || 0;
    const itemDiscountedPrice = Number(item.discountedPrice) || 0;
    const itemQuantity = item.quantity || 0;

    const itemTotal = itemDiscountedPrice * itemQuantity; // Use discounted price
    total += itemTotal;

    // Calculate total discount for this item
    const itemDiscount = (itemSellPrice - itemDiscountedPrice) * itemQuantity;
    totalDiscount += itemDiscount;

    cartElement.innerHTML += `
      <tr class="cart-item">
        <td>${item.name}</td>
        <td>R${itemSellPrice.toFixed(2)} <span class="discount">(Discount: ${item.discount}%)</span></td>
        <td>
          <div class="quantity-control">
            <button onclick="changeQuantity('${productId}', -1)">-</button>
            ${itemQuantity}
            <button onclick="changeQuantity('${productId}', 1)">+</button>
          </div>
        </td>
        <td>R${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  document.getElementById('total-discount').textContent = `Total Discount: R${totalDiscount.toFixed(2)}`;
  document.getElementById('total-amount').textContent = `Total Amount: R${(total).toFixed(2)}`;

  toggleLoader(false); // Hide loader after rendering
};


// Function to change product quantity
const changeQuantity = async (productId, delta) => {
  const cart = await getCartFromFirebase();
  
  if (cart[productId]) {
    cart[productId].quantity += delta;
    
    if (cart[productId].quantity <= 0) {
      delete cart[productId];
    }
    
    await saveCartToFirebase(cart);
    await renderCart(); // Ensure cart is rendered after update
  }
};

// Clear cart functionality
const clearCart = async () => {
  const user = getCurrentUser();
  if (!user) return;

  const cartRef = ref(db, `Users/${user.uid}/cart`);
  await set(cartRef, {}); // Clear the cart in Firebase
  await renderCart(); // Re-render the cart after clearing
};

// Expose functions to the global scope
window.changeQuantity = changeQuantity;
window.clearCart = clearCart;

// Initialize cart rendering
document.addEventListener('DOMContentLoaded', () => {
  renderCart(); // Initial render
  document.getElementById('clear-cart').addEventListener('click', clearCart);
});

// Export functions for use in other modules
export { getCartFromFirebase, saveCartToFirebase, addToCart, renderCart, changeQuantity, clearCart };
