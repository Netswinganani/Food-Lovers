
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDzw7ZlyNJ3gFaXTGQSiQBVJOfF9AUoFlo",
    authDomain: "serverloverlovers.firebaseapp.com",
    databaseURL: "https://serverloverlovers-default-rtdb.firebaseio.com",
    projectId: "serverloverlovers",
    storageBucket: "serverloverlovers.appspot.com",
    messagingSenderId: "275953881818",
    appId: "1:275953881818:web:22586af46cc9ff9bdf8be3",
    measurementId: "G-8HF43R7VHL"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);


//button event 
document.getElementById("img-upload-btn").addEventListener("click", function () {
    // Capture form values
    const productName = document.getElementById("product-name").value;
    const productImage = document.getElementById("link-img-4").value;

    if (productName && productImage) {
      // Push data to Firebase Realtime Database
      const newProductRef = database.ref("products").push();
      newProductRef.set({
        name: productName,
        imageUrl: productImage,
      })
      .then(() => {
        alert("Product added successfully!");
      })
      .catch((error) => {
        console.error("Error adding product:", error);
      });
    } else {
      alert("Please fill out all fields.");
    }
  });