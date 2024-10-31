import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';
import { database, storage } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const productSection = document.querySelector('.product-data');
  const loader = document.querySelector('.loader');

  // Show loader while data is being fetched
  loader.classList.remove('hide');
  productSection.classList.add('hide');

  // Reference to products in Firebase
  const productsRef = ref(database, 'products');

  // Fetch products data
  onValue(productsRef, async (snapshot) => {
    const products = snapshot.val();
    if (products) {
      // Clear existing content
      productSection.innerHTML = '';

      for (const [key, product] of Object.entries(products)) {
        console.log('Product data:', product); // Debugging: Log product data

        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');

        // Error handling for missing images array
        const images = product.images || [];
        if (images.length === 0) {
          console.warn('No images available for product:', product.name); // Debugging: Log warning
        }

        // Construct HTML for each product
        productDiv.innerHTML = `
          <div class="product-images">
            <img src="${images[0] || 'placeholder-image.jpg'}" class="image" alt="${product.name}" />
          </div>
          <div class="details">
            <h3 class="product-brand">${product.name || 'N/A'}</h3>
            <p class="product-short-desc">${product.shortDesc || 'N/A'}</p>
            <div class="div1">
              <span class="product-price">${product.sellPrice || 'N/A'}</span>
              <span class="product-actual-price">${product.actualPrice || 'N/A'}</span>
              <span class="product-discount">${product.discount || 'N/A'}% OFF</span>
            </div>
            <div class="div2">
              <span class="usage">Treatment for </span>
              <span class="use">${product.use || 'N/A'}</span>
            </div>
            <div class="div3">
              <span class="seller">Sold by </span>
              <button class="sold-by">Seller</button>
            </div>
            <p class="product-sub-heading">Enter quantity :</p>
            <input type="number" class="quantity" value="1" min="1" />
            <button class="btn cart-btn">Add to Cart</button>
            <button class="btn wish-btn">Add to Wishlist</button>
          </div>
          <div class="product-spec">
            <h2 class="heading">Specifications :</h2>
            <p class="spec">${product.description || 'N/A'}</p>
            <div class="ex-details">
              <div>
                <span class="man">Manufacture Date </span>
                <span class="man-date">${product.manuDate || 'N/A'}</span>
              </div>
              <div>
                <span class="expiry">Expiry Date </span>
                <span class="expiry-date">${product.exDate || 'N/A'}</span>
              </div>
              <div>
                <span class="per">Prescription Required </span>
                <span class="per-ans">${product.prescription || 'N/A'}</span>
              </div>
              <div>
                <span class="stock">Stock </span>
                <span class="stock-ans">${product.stock || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div class="pro-imgs">
            ${images.slice(1).map((img, idx) => `<div class="pro-img1"><img src="${img}" id="img${idx + 1}" /></div>`).join('')}
          </div>
          <hr style="height: 2px; border-width: 0; color: gray; background-color: gray;" />
        `;

        // Append product to the product section
        productSection.appendChild(productDiv);
      }

      // Hide loader and show product data
      loader.classList.add('hide');
      productSection.classList.remove('hide');
    } else {
      productSection.innerHTML = '<p>No products available.</p>';
    }
  }, {
    onlyOnce: true
  });
});
