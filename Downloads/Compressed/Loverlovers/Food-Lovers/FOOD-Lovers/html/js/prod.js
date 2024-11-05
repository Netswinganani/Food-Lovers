import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';
import { addToCart } from './cart.js'; // Ensure this import path is correct
import { app } from './firebase.js';

const auth = getAuth(app);
const db = getDatabase();
const storage = getStorage();

document.addEventListener('DOMContentLoaded', () => {
    displayUsername();
    
    fetchProducts();
  });
  
  function displayUsername() {
    const user = auth.currentUser;
    const usernameElement = document.getElementById('username');
  
    if (user && user.displayName) {
      // Assuming you have an element with ID 'username' to display the name
      usernameElement.textContent = `Welcome, ${user.displayName}!`;
      console.log('this is the user',user)
    } else {
      usernameElement.textContent = 'Welcome, Guest!';
    }
  }
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
    const loader = document.querySelector(".loader");
    
    loader.style.display = "block";

    onValue(productRef, (snapshot) => {
        const products = snapshot.val();
        loader.style.display = 'none'; // Hide the loader

        if (products) {
            window.products = products; // Store products globally for filtering
            const categoryCounts = countProductsByCategory(products);
            updateCategoryButtons(categoryCounts);
            displayProducts(products); // Initially display all products
            setupFiltersAndSorting(products);
        } else {
            console.log('No products found');
        }
    }, (error) => {
        loader.style.display = 'none'; // Hide the loader on error
        console.error('Error fetching products:', error);
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
            let filteredProducts = selectedCategory === 'All' ? products : filterProductsByCategory(products, selectedCategory);
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

// Filter products by price
const filterProductsByPrice = (products, filterOption) => {
    let filteredProducts = Object.keys(products).map(key => ({ key, ...products[key] }));

    if (filterOption === 'lowest') {
        filteredProducts.sort((a, b) => (Number(a.sellPrice) || 0) - (Number(b.sellPrice) || 0));
    } else if (filterOption === 'highest') {
        filteredProducts.sort((a, b) => (Number(b.sellPrice) || 0) - (Number(a.sellPrice) || 0));
    }

    return filteredProducts.reduce((acc, product) => {
        acc[product.key] = product;
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

        // Fetch product images from Firebase Storage
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

        productItem.innerHTML = 
            `<div class="product-card-search">
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
            </div>`;
        
        // Add event listener to show product details and open cart panel
        productItem.addEventListener('click', () => {
            addToCart(product); // Add product to cart
            openCartPanel(); // Open the cart panel
            showProductDetails(product, imageUrls);
        });

        productList.appendChild(productItem);
    });
};
const openCartPanel = (type) => {
  if (type === 'cart') {
      // Close product detail panel if it's open
      panel.classList.remove('active');
      cartPanel.classList.add('active'); // Open cart panel
  } else if (type === 'product') {
      cartPanel.classList.remove('active'); // Close cart panel
      panel.classList.add('active'); // Open product detail panel
  }
};
// Show product details in side panel
const showProductDetails = (product, imageUrls) => {
  console.log('Showing product details for:', product);
  console.log('Image URLs:', imageUrls);

  const panel = document.getElementById('side-panel');
  const mainImage = document.getElementById('main-image');
  const thumbnailsContainer = document.getElementById('thumbnails');
  const productName = document.getElementById('product-name');
  const productDetailsList = document.getElementById('product-details-list');
  const addToCartButton = document.querySelector('.side-panel .add-to-cart');
  console.log('Add to Cart Button:', addToCartButton); // Check if button is found

  if (!panel || !mainImage || !thumbnailsContainer || !thumbnails || !productName || !productDetailsList || !addToCartButton) {
      console.error('Side panel or required elements not found');
      return;
  }

  mainImage.src = imageUrls[0] || 'images/noimg.jpg';
    productName.textContent = product.name;

    // Call the function to update product details
    updateProductDetails(product);
    // Display thumbnails
    displayThumbnails(imageUrls, thumbnailsContainer);

    // Update product details
    updateProductDetails(product,panel,addToCartButton, productDetailsList);

    // Fetch other products in the same category
    fetchOtherProducts(product.cate, product.key);
    console.log('Fetching other products for category:', product.cate);

  

    panel.classList.add('active'); // Open the side panel
};

// Function to display thumbnails
const displayThumbnails = (imageUrls, thumbnailsContainer) => {
    console.log('Displaying thumbnails...');

    if (!thumbnailsContainer) {
        console.error('Thumbnails container not found');
        return;
    }

    thumbnailsContainer.innerHTML = ''; // Clear existing thumbnails

    // Check if imageUrls is an array and has items
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.warn('No images found to display as thumbnails.');
        return;
    }

    imageUrls.forEach((url, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = url;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = 'thumbnail'; // Add class for styling if needed

        // Add click event to change main image
        thumbnail.addEventListener('click', () => {
            const mainImage = document.getElementById('main-image');
            if (mainImage) {
                mainImage.src = url; // Change main image source to thumbnail
                console.log(`Main image updated to: ${url}`);
            } else {
                console.error('Main image element not found');
            }
        });

        thumbnailsContainer.appendChild(thumbnail); // Add thumbnail to container
        console.log(`Thumbnail added: ${url}`);
    });
};
const showAlert = (msg) => {
    console.log('showAlert called with message:', msg); // Debug log

    let alertBox = document.querySelector(".alert-box");
    let alertMsg = document.querySelector(".alert-msg");
    let alertImg = document.querySelector(".alert-img");

    alertMsg.innerHTML = msg; // Set the alert message

    alertBox.classList.add("show"); // Show the alert box

    setTimeout(() => {
        alertBox.classList.remove("show"); // Hide the alert after 3 seconds
    }, 3000);
};

// Function to update product details
const updateProductDetails = (product, panel, productDetailsList, addToCartButton) => {
  
  console.log('Updating product details for:', product);

  const productShortDesc = document.getElementById('product-short-desc');
  const productDescription = document.getElementById('product-description');
  const productActualPrice = document.getElementById('product-actual-price');
  const productDiscount = document.getElementById('product-discount');
  const productSellPrice = document.getElementById('product-sell-price');
  const productStock = document.getElementById('product-stock');
  const productUse = document.getElementById('product-use');
  const productCategory = document.getElementById('product-category');
  const productManuDate = document.getElementById('product-manu-date');
  const productExDate = document.getElementById('product-ex-date');

  // Check if elements are found
  if (!productShortDesc || !productDescription || !productActualPrice || !productDiscount ||
      !productSellPrice || !productStock || !productUse || !productCategory || !productDetailsList || 
      !productManuDate || !productExDate) {
      console.error('One or more product detail elements not found');
      return;
  }

  // Update the spans with product information
  productShortDesc.textContent = product.shortDesc || 'N/A';
  productDescription.textContent = product.description || 'N/A';
  productActualPrice.textContent = `R${product.actualPrice || 'N/A'}`;
  productDiscount.textContent = `R${product.discount || 'N/A'}`;
  productSellPrice.textContent = `R${Number(product.sellPrice).toFixed(2) || 'N/A'}`;
  productStock.textContent = product.stock || 'N/A';
  productUse.textContent = product.use || 'N/A';
  productCategory.textContent = product.cate || 'N/A';
  productManuDate.textContent = product.manuDate || 'N/A';
  productExDate.textContent = product.exDate || 'N/A';

  panel.classList.add('active'); // Open the side panel

  // Handle adding the product to the cart
  

  // Fetch Related products in the same category
  fetchOtherProducts(product.cate, product.key);
  panel.classList.add('active'); // Open the side panel

  // Handle adding the product to the cart
// Inside your product detail display logic
addToCartButton.addEventListener('click', () => {
    
    addToCart(product).then(() => {
      showAlert('Product added to cart!');
    }).catch((error) => {
        console.error('Error adding to cart:', error);
        showAlert('Failed to add product to cart.');
    });
}, { once: true });

}

// Fetch and display Related products in the same category
const fetchOtherProducts = async (category, currentProductKey) => {
  const productRef = ref(db, 'products');
  onValue(productRef, (snapshot) => {
      const products = snapshot.val();

/* Debug related products
      //list product det on cosole
Object.values(products).forEach(product => {
    console.log('Product Object:', product); // Log the entire product object
});
*/

      if (products) {
        console.log('Fetched products:', products); // Log all products
       

        Object.values(products).forEach(product => {
          console.log(`Product Key: ${product.key}, Category: ${product.cate}`);
      });

          // Filter products by the same category, excluding the current product
          const sameCategoryProducts = Object.keys(products).filter(key => {
            const product = products[key]; // Get product using the key
            return product.cate === category && key !== currentProductKey; // Use 'key' as the unique identifier
        }).map(key => products[key]); // Map back to product objects
        
         console.log('Category being filtered for:', category);
          console.log('Filtered related products:', sameCategoryProducts); 
          if (sameCategoryProducts.length > 0) {
              console.log('Fetched related products:', sameCategoryProducts);
              displayOtherProducts(sameCategoryProducts);
          } else {
              console.log('No other products available in this category.',sameCategoryProducts);
              displayOtherProducts([]); // Show a message for no products
          }
      } else {
          console.log('No products found.');
          displayOtherProducts([]); // Ensure to handle empty products
      }
  });
};

// Display Related products in the same category
const displayOtherProducts = (products) => {
  const otherProductsList = document.getElementById('other-products-list');
  if (!otherProductsList) {
      console.error('Other products list container not found');
      return;
  }

  otherProductsList.innerHTML = ''; // Clear previous products

  if (products.length === 0) {
      otherProductsList.innerHTML = '<p>No Related products available in this category.</p>';
      return;
  }

  // Iterate over products to display them
  products.forEach(async (product) => {
      const productItem = document.createElement('div');
      productItem.className = 'other-product-item';
      productItem.dataset.productKey = product.key; // Add product key for later use

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

      productItem.innerHTML = 
          `<div class="product-card-search">
              <div class="product-image-search">
                  <span class="discount-tag-search">${product.discount || 'No Discount'}</span>
                  <img src="${imageUrls[0]}" class="product-thumb-searc" alt="${product.name || 'Product Image'}">
                  <button class="card-btn-search">Add to Cart</button>
              </div>
              <div class="product-info-search">
                  <span class="product-brand-search">${product.name || 'Unnamed Product'}</span>
                  <p class="product-short-desc-search">${product.shortDesc || 'N/A'}</p>
                  <p class="product-usage-search">${product.use || 'N/A'}</p>
                  <span class="price-search">R${sellPrice.toFixed(2)}</span>
                  <span class="actual-price-search">R${actualPrice.toFixed(2) || 'N/A'}</span>
              </div>
          </div>`;
          
      // Add event listener to show product details and open cart panel
      productItem.addEventListener('click', () => {
          showProductDetails(product, imageUrls);
          openCartPanel(); // Open the cart panel on clicking an item
      });

      otherProductsList.appendChild(productItem);
  });
};

// Ensure the close button works for the side panel
document.getElementById('close-panel').addEventListener('click', () => {
    const panel = document.getElementById('side-panel');
    if (panel) {
        panel.classList.remove('active'); // Hide the side panel
    }
});
auth.onAuthStateChanged((user) => {
    if (user) {
      displayUsername();
    } else {
      // User is signed out
      document.getElementById('username').textContent = 'Welcome, Guest!';
    }
  });
  
// Initialize the script
fetchProducts();
