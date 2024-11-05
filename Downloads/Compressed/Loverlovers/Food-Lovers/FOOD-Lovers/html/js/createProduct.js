import { database } from './firebase.js';  // Ensure this path is correct
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Initialize any necessary variables
let openEditor;

const radio = document.querySelector(".tabs");

radio.addEventListener("change", () => {
  const radioVal = document.querySelector('input[name="tabs"]:checked').value;
  const productSection = document.querySelector(".add-product");
  const productContainer = document.querySelector(".product-container");
  const heading4 = document.querySelector(".heading-4");
  const orderList = document.querySelector(".order-list");
  const heading5 = document.querySelector(".heading-5");
  const orderHistoryList = document.querySelector(".order-history-list");

  switch (radioVal) {
    case "products":
      productSection.classList.remove("hide");
      productContainer.classList.remove("hide");
      heading4.classList.add("hide");
      orderList.classList.add("hide");
      heading5.classList.add("hide");
      orderHistoryList.classList.add("hide");
      break;
    case "orders":
      heading4.classList.remove("hide");
      orderList.classList.remove("hide");
      productSection.classList.add("hide");
      productContainer.classList.add("hide");
      heading5.classList.add("hide");
      orderHistoryList.classList.add("hide");
      break;
    case "history":
      heading5.classList.remove("hide");
      orderHistoryList.classList.remove("hide");
      heading4.classList.add("hide");
      orderList.classList.add("hide");
      productSection.classList.add("hide");
      productContainer.classList.add("hide");
      break;
    default:
      break;
  }
});

const setUpColor = (data) => {
  const proStatus = document.querySelectorAll("#product-status");
  proStatus.forEach((status, i) => {
    if (data[i] && data[i].status === "Active") {
      status.style.color = "#1fa4cc";
    }
  });
};

// Function to create and save a product
const createProduct = async (data) => {
  const productId = data.id; // Ensure this is a unique ID for the product

  // Reference to the Realtime Database location
  const productRef = ref(database, 'products/' + productId);

  try {
    await set(productRef, data);
    console.log('Product saved successfully.');
    displayProduct(data); // Display product in UI (optional)
  } catch (error) {
    console.error('Error saving product:', error);
  }
};

// Function to display a product
const displayProduct = (data) => {
  const active = "Active";
  const disabled = "Disabled";
  const proContainer = document.querySelector(".product-container");

  const buttonHTML = (id, status) => `
    <button class="action-btn edit-btn" onClick="openEditor('${id}')">Edit</button>
    <button class="action-btn open-btn" onClick="openProduct('${id}')">Open</button>
    <button class="action-btn delete-btn" onClick="openDelPopup('${id}')">Delete</button>
    <button class="action-btn ${status === active ? 'disable-btn' : 'enable-btn'}" onClick="disableProductSeller('${id}', '${status === active ? disabled : active}')">
      ${status === active ? 'Disable' : 'Enable'}
    </button>
  `;

  proContainer.innerHTML += `
    <div class="product-card">
      <div class="product-image">
        <span class="discount-tag">${data.discount}</span>
        <span class="product-status" id="product-status">${data.status}</span>
        <img src="${data.image1}">
        ${buttonHTML(data.id, data.status)}
      </div>
      <div class="product-info">
        <p class="product-brand">${data.name}</p>
        <p class="product-shortdesc">${data.shortDesc}</p>
        <p class="product-usage">${data.use}</p>
        <span class="price">${data.sellPrice}</span>
        <span class="actual-price">${data.actualPrice}</span>
      </div>
    </div>
  `;
};

// Function to load products from Firebase
const loadProducts = async () => {
  const productsRef = ref(database, 'products');

  try {
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        displayProduct(product);
      });
    } else {
      console.log('No products found.');
    }
  } catch (error) {
    console.error('Error retrieving products:', error);
  }
};

// Function to update a product
const updateProduct = async (productId, updatedData) => {
  const productRef = ref(database, 'products/' + productId);

  try {
    await update(productRef, updatedData);
    console.log('Product updated successfully.');
  } catch (error) {
    console.error('Error updating product:', error);
  }
};

// Function to delete a product
const deleteProduct = async (productId) => {
  const productRef = ref(database, 'products/' + productId);

  try {
    await remove(productRef);
    console.log('Product deleted successfully.');
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

// Additional functions to manage UI and events
openEditor = (id) => {
  sessionStorage.tempProduct = JSON.stringify({ id });
  location.href = `/add-product/${id}`;
};

const openProduct = (id) => {
  sessionStorage.tempProduct = JSON.stringify({ id });
  location.href = `./product/${id}`;
};

const openDelPopup = (id) => {
  const deleteAlert = document.querySelector(".delete-alert");
  deleteAlert.style.display = "flex";

  const closeBtn = document.querySelector(".close-btn");
  closeBtn.addEventListener("click", () => (deleteAlert.style.display = "none"));

  const delBtn = document.querySelector(".del-btn");
  delBtn.addEventListener("click", () => deleteProduct(id));
};

const disableProductSeller = (id, status) => {
  const data = { id, status };

  fetch("/toggle-product", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ data })
  })
    .then((res) => res.json())
    .then((response) => {
      if (response === "success") {
        location.reload();
      } else {
        showAlert("Some problem occurred. Please try again.");
      }
    });
};

// Utility functions for setting counts
const setProductCount = (count) => {
  const proCount = document.querySelector(".pro-count");
  proCount.innerHTML = count;

  if (count === 0) {
    document.querySelector(".no-products-img").classList.remove("hide");
  }
};

const setOrderCount = (count) => {
  const orderCount = document.querySelector(".order-count");
  orderCount.innerHTML = count - 1;

  if (count - 1 === 0) {
    document.querySelector(".no-orders-img").classList.remove("hide");
  }
};

const setHistoryCount = (count) => {
  const historyCount = document.querySelector(".order-history-count");
  historyCount.innerHTML = count - 1;

  if (count - 1 === 0) {
    document.querySelector(".no-history-img").classList.remove("hide");
  }
};

// Initialize page
window.onload = () => {
  loadProducts();
};
