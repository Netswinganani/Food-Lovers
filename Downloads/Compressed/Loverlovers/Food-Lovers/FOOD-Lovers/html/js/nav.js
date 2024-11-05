import { database } from './firebase.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';

const user = JSON.parse(sessionStorage.getItem('user'));
console.log('User from sessionStorage:', user);

// Fetch all products from Realtime Database
const getAllProducts = async () => {
  try {
    const dbRef = ref(database, 'products');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const products = snapshot.val();
      await discardProduct(Object.values(products));
    } else {
      console.log("No data available");
    }
  } catch (error) {
    console.error("Error fetching products:", error.message);
  }
};

// Disable a product by updating its status
const disableProduct = async (id, status) => {
  try {
    const productRef = ref(database, `products/${id}`);
    await set(productRef, { status: status }, { merge: true });
  } catch (error) {
    console.error("Error updating product status:", error.message);
  }
};

// Check product status and update if necessary
const discardProduct = async (data) => {
  const currentDate = new Date();

  for (const product of data) {
    const exDate = new Date(product.exDate);
    
    if (product.stock === 0) {
      await disableProduct(product.id, "Out of Stock");
    } else if (exDate < currentDate) {
      await disableProduct(product.id, "Expired");
    }
  }
};

// Your existing code...

// Create navigation bar
const createNav = () => {
  const nav = document.querySelector(".navbar");

  if (nav) {
    nav.innerHTML = `
      <div class="nav">
          <img src="./images/headerlogo.jpg" class="brand-logo" alt="Brand Logo">
          <div class="nav-items">
              <div class="search">
                  <input type="text" class="search-box" placeholder="Search food, Categories">
                  <button class="search-btn">Search</button>
              </div>
              <a>
                  <img src="./images/user.png" id="user-img" alt="User Image">
                  <div class="login-logout-popup hide">
                      <p class="account-info">Logged-in as, Name</p>
                      <button class="btn" id="user-btn">Log Out</button>
                  </div>
              </a>         
              <a href="./cart.html">
                  <img src="./images/cart.png" id="cart-img" alt="Cart Image">
              </a>
          </div>
      </div>
      <ul class="links-container">
          <li class="link-item"><a href="./prod.html" class="link">Home</a></li>
          <li class="link-item"><a href="./payinstore.html" class="link">Store_Recipt</a></li>
          <li class="link-item"><a href="./about.html" class="link">About</a></li>
          <li class="link-item"><a href="./contact.html" class="link">Contact</a></li>
          <li class="link-item"><a href="./payment-history.html" class="link">History</a></li>
          <li class="link-item"><a href="./user-profile.html" class="link">Profile</a></li>
      </ul>
    `;
  }
};

// Toggle user popup
const toggleUserPopup = () => {
  const userImageButton = document.querySelector("#user-img");
  const userPopup = document.querySelector(".login-logout-popup");
  const popupText = document.querySelector(".account-info");
  const actionBtn = document.querySelector("#user-btn");

  if (userImageButton && userPopup && popupText && actionBtn) {
    userImageButton.addEventListener("click", () => {
      userPopup.classList.toggle("hide");
    });

    window.onload = async () => {
      let user = JSON.parse(sessionStorage.getItem('user') || null);
      console.log('User from sessionStorage:', user); // Debugging line

      if (user) {
        // Fetch user details from the database
        try {
          const userRef = ref(database, `Users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            popupText.innerHTML = `Logged-in as, ${userData.name || 'User'}`; // Display the user's name
          } else {
            console.error("User data not found in database");
            popupText.innerHTML = "User data not found";
          }
        } catch (error) {
          console.error("Error retrieving user data:", error.message);
          popupText.innerHTML = "Error retrieving user data";
        }

        actionBtn.innerHTML = "Log Out";
        actionBtn.addEventListener("click", () => {
          sessionStorage.clear();
          location.href = "./index.html"; //solve for errorvFailed to load resource: net::ERR_CONNECTION_RESET
        });
      } else {
        popupText.innerHTML = "Log In to Place Order";
        actionBtn.innerHTML = "Log In";
        actionBtn.addEventListener("click", () => {
          location.href = "./login.html";
        });
      }

      await getAllProducts();
    };
  } else {
    console.error("User image button, user popup, popup text, or action button not found");
  }
};

// Redirect to search page with query
const handleSearch = () => {
  const searchBtn = document.querySelector(".search-btn");
  const searchBox = document.querySelector(".search-box");

  if (searchBtn && searchBox) {
    searchBtn.addEventListener("click", () => {
      const query = searchBox.value.trim();
      if (query.length) {
        // Redirect to the search page with the query as a URL parameter
        location.href = `search.html?query=${encodeURIComponent(query)}`;
      } else {
        console.warn("Search query is empty. Please enter a search term.");
      }
    });
  } else {
    console.error("Search button or search box not found");
  }
};


// Initialize everything
const initializeApp = () => {
  createNav();
  toggleUserPopup();
  handleSearch();
};

initializeApp();
