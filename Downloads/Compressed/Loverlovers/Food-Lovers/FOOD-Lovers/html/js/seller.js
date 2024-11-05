import { database } from './firebase.js';  // Ensure correct path to firebase.js
import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

let loader = document.querySelector(".loader");
let user = JSON.parse(sessionStorage.user || null);

const becomeSeller = document.querySelector(".become-seller");
const applyForm = document.querySelector(".apply-form");
const showApplyFormBtn = document.querySelector("#apply-btn");

const applyBtn = document.querySelector("#apply-form-btn");
const businessName = document.querySelector("#business-name");
const businessAdd = document.querySelector("#business-add");
const pincode = document.querySelector("#pincode");
const about = document.querySelector("#about");
const number = document.querySelector("#number");
const tac = document.querySelector("#terms-and-cond");

// Function to show alert messages
const showAlert = (msg) => {
  let alertBox = document.querySelector(".alert-box");
  let alertMsg = document.querySelector(".alert-msg");

  if (alertBox && alertMsg) {
    alertMsg.innerHTML = msg;
    alertBox.classList.add("show");
    setTimeout(() => {
      alertBox.classList.remove("show");
    }, 3000);
  } else {
    console.error("Alert elements not found in the DOM.");
  }
};

// Event listener for applying to become a seller
showApplyFormBtn.addEventListener("click", () => {
  becomeSeller.classList.add("hide");
  applyForm.classList.remove("hide");
});

applyBtn.addEventListener("click", async () => {
  if (
    !businessName.value.length ||
    !businessAdd.value.length ||
    !about.value.length ||
    !number.value.length
  ) {
    showAlert("Fill All the Inputs");
    return;
  } else if (!tac.checked) {
    showAlert("You must agree to all the terms and conditions");
    return;
  }

  try {
    if (loader) {
      loader.style.display = "block";
    }

    // Prepare application data
    const applicationData = {
      name: businessName.value,
      address: businessAdd.value,
      pincode: pincode.value,
      about: about.value,
      number: number.value,
      email: user.email, // Include the user's email for reference
      timestamp: new Date().toISOString() // Add a timestamp for when the application was submitted
    };

// Save application data to Realtime Database
const applicationRef = ref(database, 'AdminRequests'); // Reference to the AdminRequests node
const newApplicationRef = ref(database, `AdminRequests/${new Date().getTime()}`); // Create a unique key based on timestamp
await set(newApplicationRef, applicationData);


    showAlert("Your application has been submitted for review.");

    // Optionally, reset the form fields here
    businessName.value = '';
    businessAdd.value = '';
    pincode.value = '';
    about.value = '';
    number.value = '';
    tac.checked = false; // Reset checkbox

  } catch (error) {
    console.error("Error saving application data: ", error);
    showAlert("Error saving data. Please try again.");
  } finally {
    if (loader) {
      loader.style.display = "none";
    }
  }
});

// Check user status and handle accordingly
if (user) {
  if (!user.seller) {
    becomeSeller.classList.remove("hide");
  } else {
    // User is already a seller; you can implement any necessary logic here
  }
} else {
  location.replace("./login.html");
}
