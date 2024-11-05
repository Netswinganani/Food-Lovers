import { auth, database, signInWithEmailAndPassword } from './firebase.js';
import { ref, set, get, push } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
        checkAdminStatus(currentUser.uid);
    }
});

const loaderElement = document.querySelector(".loader");
const submitButton = document.querySelector(".submit-btn");
const adminEmailInput = document.querySelector("#adminEmail");
const adminPasswordInput = document.querySelector("#adminPassword");
const alertBox = document.querySelector(".alert-box");
const alertMessage = document.querySelector(".alert-msg");
const adminRequestForm = document.querySelector("#adminRequestForm");
const newAdminNameInput = document.querySelector("#newAdminName");
const newAdminEmailInput = document.querySelector("#newAdminEmail");

document.addEventListener("DOMContentLoaded", () => {
    submitButton.addEventListener("click", (event) => {
        event.preventDefault();
        loginAdmin();
    });

    // Handle admin request submission
    adminRequestForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitAdminRequest();
    });
});

// Login function for existing admins
const loginAdmin = () => {
    if (!adminEmailInput.value || !adminPasswordInput.value) {
        displayAlert("Please fill in all fields");
    } else {
        loaderElement.style.display = "block";
        signInWithEmailAndPassword(auth, adminEmailInput.value, adminPasswordInput.value)
            .then((userCredential) => {
                const user = userCredential.user;

                // Force token refresh
                user.getIdToken(true).then(() => {
                    // Check if the user is in the Admins table
                    const adminRef = ref(database, `Admins/${user.uid}`);
                    get(adminRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            // User is an admin
                            sessionStorage.setItem('adminUser', JSON.stringify({ uid: user.uid, email: user.email }));
                            window.location.replace("./AdminDash.html");
                        } else {
                            // User is not an admin
                            loaderElement.style.display = "none";
                            displayAlert("You are not authorized to access this page.");
                        }
                    }).catch((error) => {
                        loaderElement.style.display = "none";
                        console.error('Error checking admin status:', error);
                        displayAlert("An error occurred while checking admin status.");
                    });
                });
            })
            .catch((error) => {
                loaderElement.style.display = "none";
                displayAlert("Invalid email or password");
            });
    }
};

// Function to submit admin requests
const submitAdminRequest = () => {
    const newAdminName = newAdminNameInput.value;
    const newAdminEmail = newAdminEmailInput.value;

    const requestData = {
        name: newAdminName,
        email: newAdminEmail,
        status: 'pending', // Set the initial status to pending
        requestedBy: auth.currentUser.uid // ID of the existing admin who made the request
    };

    const requestRef = ref(database, 'AdminRequests');
    const newRequestRef = push(requestRef); // Create a new reference with a unique key
    set(newRequestRef, requestData)
        .then(() => {
            displayAlert('Admin request submitted successfully!');
            adminRequestForm.reset(); // Clear the form
        })
        .catch((error) => {
            console.error('Error submitting request:', error);
            displayAlert('Error submitting request: ' + error.message);
        });
};

// Check if the user is an admin
const checkAdminStatus = (userId) => {
    const adminRef = ref(database, `Admins/${userId}`);
    get(adminRef).then((snapshot) => {
        if (snapshot.exists()) {
            const adminData = snapshot.val();
            if (adminData.role === 'admin') {
                sessionStorage.setItem('isAdmin', 'true');
                console.log('User has admin access');
            } else {
                sessionStorage.setItem('isAdmin', 'false');
                console.log('User does not have admin access');
            }
        } else {
            sessionStorage.setItem('isAdmin', 'false');
            console.log('User is not found in Admins table');
        }
    }).catch((error) => {
        console.error('Error checking admin status:', error);
    });
};



// Function to display alerts
const displayAlert = (message) => {
    alertMessage.innerHTML = message;
    alertBox.classList.add("show");
    setTimeout(() => {
        alertBox.classList.remove("show");
    }, 3000);
};
