import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js'; 
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js'; 
import { storage, database } from './firebase.js';  // Import your Firebase configuration

document.getElementById('add-btn').addEventListener('click', async () => {
  const productName = document.getElementById('product-name').value;
  const shortDesc = document.getElementById('short-desc').value;
  const description = document.getElementById('description').value;
  const actualPrice = parseFloat(document.getElementById('actual-price').value);
  const discount = parseFloat(document.getElementById('discount').value);
  const sellPrice = parseFloat(document.getElementById('sell-price').value);
  const stock = parseInt(document.getElementById('stock').value, 10);
  const use = document.getElementById('use').value;
  const cate = document.getElementById('cate').value;
  const manuDate = document.getElementById('manuDate').value;
  const exDate = document.getElementById('exDate').value;
  const prescription = document.getElementById('prescription').value;

  const imageInputs = [
    document.getElementById('link-img-1'),
    document.getElementById('link-img-2'),
    document.getElementById('link-img-3'),
    document.getElementById('link-img-4')
  ];

  // Validate fields
  if (!productName || !shortDesc || !description || isNaN(actualPrice) || isNaN(discount) || isNaN(sellPrice) || isNaN(stock) || !use || !cate || !manuDate || !exDate || !prescription) {
    alert('Please fill out all fields correctly.');
    return;
  }
  // Ensure stock is at least 20
  if (stock < 20) {
    alert('Stock cannot be less than 20. Setting stock to 20.');
    stock = 20; // Set stock to minimum value of 20
  }

  // Calculate the actual price
  const calculatedActualPrice = calculateActualPrice(sellPrice, discount);

  // Check if the provided actual price matches the calculated one
  if (actualPrice !== calculatedActualPrice) {
    alert(`Actual price must be R${calculatedActualPrice.toFixed(2)} based on the sell price and discount.`);
    return;
  }

  try {
    // Upload images
    const imageUrls = await Promise.all(imageInputs.map(async (input, index) => {
      if (input && input.files.length > 0) {
        const file = input.files[0];
        const fileName = `${Date.now()}_${index}_${file.name}`; // Create a unique file name
        const fileRef = storageRef(storage, `images/${fileName}`);
        try {
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        } catch (uploadError) {
          console.error(`Error uploading image ${index + 1}:`, uploadError);
          return null;
        }
      }
      return null;
    }));

    // Construct product data
    const productData = {
      name: productName,
      shortDesc: shortDesc,
      description: description,
      images: imageUrls.filter(url => url !== null), // Filter out failed uploads
      actualPrice: calculatedActualPrice, // Use calculated actual price
      discount: discount,
      sellPrice: sellPrice,
      stock: stock,
      use: use,
      cate: cate,
      manuDate: manuDate,
      exDate: exDate,
      prescription: prescription
    };

    // Save product data to Realtime Database using push for unique ID
    
    const productRef = ref(database, 'products');
    const newProductRef = push(productRef);
    
    const productWithId = {
      ...productData,
      id: newProductRef.key // Assign the generated ID
    };

    await set(newProductRef, productWithId);

    alert('Product added successfully!');
  } catch (error) {
    console.error('Error adding product:', error);
    alert('Error adding product!');
  }
});

// Function to calculate actual price based on sell price and discount
function calculateActualPrice(sellPrice, discount) {
  return sellPrice - (sellPrice * (discount / 100));
}

// Auto-populate actual price field on discount or sell price change
document.getElementById('sell-price').addEventListener('input', updateActualPrice);
document.getElementById('discount').addEventListener('input', updateActualPrice);

function updateActualPrice() {
  const sellPrice = parseFloat(document.getElementById('sell-price').value) || 0;
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const calculatedActualPrice = calculateActualPrice(sellPrice, discount);
  document.getElementById('actual-price').value = calculatedActualPrice.toFixed(2);
}
