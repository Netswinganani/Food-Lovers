import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';  
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';  
import { addToCart } from './cart.js'; // Ensure this import path is correct

const db = getDatabase();
const storage = getStorage();

// Count products in each category
const countProductsByCategory = (products) => {
  const categoryCounts = {
    "All": 0,
    "Milk, Dairy & Eggs": 0,
    "Liquor Store": 0,
    "Bakery": 0,
    "Cereal": 0,
    "Vegetables": 0,
    "Meat": 0,
    "Fruit": 0,
  };

  Object.values(products).forEach(product => {
    categoryCounts[product.cate] = (categoryCounts[product.cate] || 0) + 1;
    categoryCounts["All"] += 1; // Increment total count for "All"
  });

  return categoryCounts;
};

// Fetch products from Firebase Realtime Database
const fetchProducts = async () => {
  const productRef = ref(db, 'products');
  onValue(productRef, (snapshot) => {
    const products = snapshot.val();
    if (products) {
      window.products = products; // Store products globally for filtering
      const categoryCounts = countProductsByCategory(products);
      updateCategoryButtons(categoryCounts);
      displayProducts(products); // Initially display all products
      setupFiltersAndSorting(products);
    } else {
      console.log('No products found');
    }
  });
};

// Update category buttons with counts
const updateCategoryButtons = (categoryCounts) => {
  const categoryButtons = document.querySelectorAll('.category-button');

  categoryButtons.forEach(button => {
    const category = button.dataset.category;
    button.textContent = `${category} (${categoryCounts[category] || 0})`; // Update text with count
  });
};

// Setup category filters and sorting
const setupFiltersAndSorting = (products) => {
  const categoryButtons = document.querySelectorAll('.category-button');
  const sortSelect = document.getElementById('sort');
  const priceRangeSelect = document.getElementById('price-range');
  const applyPriceFilterButton = document.getElementById('apply-price-filter');

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.category; // Get category from data attribute

      let filteredProducts;
      if (selectedCategory === 'All') {
        filteredProducts = products; // Show all products
      } else {
        filteredProducts = filterProductsByCategory(products, selectedCategory);
      }

      displayProducts(filteredProducts);
    });
  });

  // Sorting
  sortSelect.addEventListener('change', () => {
    const sortOption = sortSelect.value;
    const sortedProducts = sortProducts(products, sortOption);
    displayProducts(sortedProducts);
  });

  // Price filter
  applyPriceFilterButton.addEventListener('click', () => {
    const selectedPrice = priceRangeSelect.value;
    const priceFilteredProducts = filterProductsByPrice(products, selectedPrice);
    displayProducts(priceFilteredProducts);
  });
};

// Filter products by category
const filterProductsByCategory = (products, category) => {
  return Object.keys(products).reduce((acc, key) => {
    if (products[key].cate === category) {
      acc[key] = products[key];
    }
    return acc;
  }, {});
};

// Display products on the page
const displayProducts = (products) => {
  const productList = document.querySelector('.product-list');
  if (!productList) {
    console.error('Product list container not found');
    return;
  }
  
  productList.innerHTML = ''; // Clear previous products

  Object.keys(products).forEach(async (key) => {
    const product = products[key];
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.dataset.productKey = key; // Add product key for later use

    let imageUrls = [];
    if (product.images && product.images.length > 0) {
      try {
        imageUrls = await Promise.all(product.images.map(async (imagePath) => {
          const imgRef = storageRef(storage, imagePath);
          return await getDownloadURL(imgRef).catch(() => 'images/noimg.jpg'); // Fallback image
        }));
      } catch (error) {
        console.error('Error fetching images:', error);
        imageUrls = ['images/noimg.jpg']; // Default if fetching fails
      }
    } else {
      imageUrls = ['images/noimg.jpg']; // Default if no images are available
    }

    const sellPrice = Number(product.sellPrice) || 0;
    const actualPrice = Number(product.actualPrice) || 0;

    productItem.innerHTML = `
      <div class="product-card-search">
        <div class="product-image-search">
          <span class="discount-tag-search">${product.discount || 'No Discount'}</span>
          <img src="${imageUrls[0]}" class="product-thumb-search" alt="${product.name || 'Product Image'}">
          <button class="card-btn-search">Add to Cart</button>
        </div>
        <div class="product-info-search">
          <span class="product-brand-search">${product.name || 'Unnamed Product'}</span>
          <p class="product-short-desc-search">${product.shortDesc || 'N/A'}</p>
          <p class="product-usage-search">${product.use || 'N/A'}</p>
          <span class="price-search">R${sellPrice.toFixed(2)}</span>
          <span class="actual-price-search">R${actualPrice.toFixed(2) || 'N/A'}</span>
        </div>
      </div>
    `;

    productItem.addEventListener('click', () => {
      showProductDetails(product, imageUrls);
    });

    productList.appendChild(productItem);
  });
};

// Show product details and other functions remain unchanged...

// Initialize the script
fetchProducts();
