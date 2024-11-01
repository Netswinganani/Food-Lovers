import { database, ref, get } from './firebase.js'; // Ensure this imports the necessary functions from firebase.js

const loader = document.querySelector(".loader");
const noSearchResultImg = document.querySelector(".no-result");
const searchResultsSection = document.querySelector(".search-results");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchSpanElement = document.getElementById("result-key");

const createProductCards = (data, parent) => {
  const p = document.querySelector(parent);
  let cardHtml = data.map(item => `
      <div class="product-card-search">
          <div class="product-image-search">
              <span class="discount-tag-search">${item.discount}</span>
              <img src="${item.image1}" class="product-thumb-search" alt="${item.name}" onerror="this.onerror=null; this.src='images/arrow.png';">
              <button class="card-btn-search">Add to Wishlist</button>
          </div>
          <div class="product-info-search">
              <a href="/product/${item.id}" class="product-brand-search">${item.name}</a>
              <p class="product-short-desc-search">${item.shortDesc}</p>
              <p class="product-usage-search">${item.use}</p>
              <span class="price-search">${item.sellPrice}</span>
              <span class="actual-price-search">${item.actualPrice}</span>
          </div>
      </div>
  `).join('');

  p.innerHTML = `<div class="product-container-search">${cardHtml}</div>`;
  loader.style.display = "none";
  searchResultsSection.classList.remove("hide");
};


const searchProducts = async (searchKey) => {
  try {
      // Fetch all products from the database
      const productsSnapshot = await get(ref(database, 'products'));
      const products = productsSnapshot.val();

      // Log the retrieved data
      console.log("Retrieved products:", products);

      // Convert products to an array if it's an object
      const productArray = products ? Object.values(products) : [];

      const filteredProducts = productArray.filter(product => {
          const name = product.name ? product.name.toLowerCase() : '';
          const category = product.cate ? product.cate.toLowerCase() : '';
          const searchKeyLower = searchKey.toLowerCase();
          const isMatch = name.includes(searchKeyLower) || category.includes(searchKeyLower);
          console.log(`Checking product: '${product.name}','${product.cate}' - Match: ${isMatch}`); // Debugging
          return isMatch;
      });

      // Log filtered products
      console.log("Filtered products:", filteredProducts);

      filteredProducts.forEach(product => {
        console.log("Product image URL:", product.image1); // Log the image URL
    });

      if (filteredProducts.length === 0) {
          noSearchResultImg.classList.remove("hide");
      } else {
          createProductCards(filteredProducts, ".results");
      }
  } catch (error) {
      console.error("Error fetching search results:", error);
      loader.style.display = "none";
  }
};



// Event listener for the search button
searchButton.addEventListener("click", () => {
  const searchKey = searchInput.value.trim();
  if (searchKey) {
    searchSpanElement.innerHTML = searchKey;
    loader.style.display = "block"; // Show loader
    noSearchResultImg.classList.add("hide"); // Hide no results image
    searchProducts(searchKey);
  }
});

// Optional: Allow pressing Enter to trigger the search
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});
// Check for query parameter in the URL
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('query');
if (query) {
  searchInput.value = query; // Set the search input value
  loader.style.display = "block"; // Show loader
  noSearchResultImg.classList.add("hide"); // Hide no results image
  searchProducts(query); // Trigger the search
}
