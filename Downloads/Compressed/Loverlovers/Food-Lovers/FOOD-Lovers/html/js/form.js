import { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user);
    checkUserRole(user.uid); // Check user role after sign-in
  } else {
    console.log('No user is signed in.');
  }
});

const loader = document.querySelector(".loader");
const submitBtn = document.querySelector(".submit-btn");
const name = document.querySelector("#name");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const number = document.querySelector("#number");
const tac = document.querySelector("#terms-and-cond");
const notification = document.querySelector("#notification");

// Prevent default form submission
document.addEventListener("DOMContentLoaded", () => {
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent page refresh

    if (name && name.value) {
      handleSignup();
    } else {
      handleLogin();
    }
  });
});

const handleSignup = () => {
  if (name.value.length < 3) {
    showAlert("Name must be at least three letters long");
  } else if (!email.value.length) {
    showAlert("Please enter your e-mail");
  } else if (password.value.length < 8) {
    showAlert("Password must be at least eight characters long");
  } else if (!number.value.length) {
    showAlert("Please enter your phone number");
  } else if (isNaN(number.value) || number.value.length < 10) {
    showAlert("Invalid Number");
  } else if (!tac.checked) {
    showAlert("You must agree to all terms and conditions");
  } else {
    loader.style.display = "block";
    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          name: name.value,
          email: email.value,
          number: number.value,
          tac: tac.checked,
          notification: notification.checked,
          role: 'user' // Default role
        };
        saveUserData(user.uid, userData);
      })
      .catch((error) => {
        loader.style.display = "none";
        showAlert("Error creating account: " + error.message);
      });
  }
};

const handleLogin = () => {
  if (!email.value.length || !password.value.length) {
    showAlert("Kindly fill all the inputs");
  } else {
    loader.style.display = "block";

    console.log("Attempting to sign in with:", {
      email: email.value,
      password: password.value.length ? '***' : '' // Mask password
    });

    signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("Logged in user:", user); // Debugging log
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
        
        // Fetch user data to check if the user is an admin
        const userRef = ref(database, `Users/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("User data:", userData); // Debugging log
            if (userData.role === 'admin') {
              loader.style.display = "none";
              location.replace("./addproduct.html"); // Redirect to admin dashboard
            } else {
              loader.style.display = "none";
              location.replace("./prod.html"); // Redirect to user home page
            }
          } else {
            loader.style.display = "none";
            showAlert("User data not found.");
          }
        }).catch((error) => {
          loader.style.display = "none";
          showAlert("Error retrieving user data: " + error.message);
        });
      })
      .catch((error) => {
        loader.style.display = "none";
        console.error("Login error:", error); // Log error for debugging
        showAlert("Invalid email or password");
      });
  }
};

const saveUserData = (userId, userData) => {
  const userRef = ref(database, `Users/${userId}`); // Save under the user's UID
  set(userRef, userData)
    .then(() => {
      loader.style.display = "none";
      showAlert("Registration successful!");
      location.replace("./login.html"); // Redirect to login page
    })
    .catch((error) => {
      loader.style.display = "none";
      showAlert("Error saving data: " + error.message);
    });
};

const checkUserRole = (userId) => {
  const userRef = ref(database, `Users/${userId}`);
  userRef.once('value', (snapshot) => {
    const userData = snapshot.val();
    if (userData && userData.role === 'admin') {
      // Perform admin-specific actions
      console.log('Admin user detected:', userData.name);
      // Redirect to admin dashboard or similar
    }
  });
};

const showAlert = (msg) => {
  const alertBox = document.querySelector(".alert-box");
  const alertMsg = document.querySelector(".alert-msg");

  alertMsg.innerHTML = msg;
  alertBox.classList.add("show");

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 3000);
};

// Function to handle admin creation
const createAdmin = (email, password, name) => {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const adminData = {
        name: name,
        email: email,
        role: 'admin' // Assign admin role
      };
      saveUserData(user.uid, adminData);
    })
    .catch((error) => {
      showAlert("Error creating admin: " + error.message);
    });
};

// Optional: Example usage of creating an admin (you can call this function as needed)
// createAdmin('admin@gmail.com', 'securePassword123', 'Admin Name');
