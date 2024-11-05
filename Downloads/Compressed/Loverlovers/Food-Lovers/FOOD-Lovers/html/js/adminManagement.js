import { database } from './firebase.js';
import { ref, get, set, remove } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-functions.js';

const adminList = document.getElementById("adminList");
const requestList = document.getElementById("requestList");
const createAdminForm = document.getElementById("createAdminForm");
const adminNameInput = document.getElementById("adminNameInput");
const adminEmailInput = document.getElementById("adminEmailInput");
const adminPasswordInput = document.getElementById("adminPasswordInput");

const functions = getFunctions(); // Move this outside of functions for better scope access

// General function to fetch data from the database
const fetchData = async (path, listElement, callback) => {
    const refPath = ref(database, path);
    const snapshot = await get(refPath);
    listElement.innerHTML = ''; // Clear existing data
    if (snapshot.exists()) {
        snapshot.forEach(callback);
    } else {
        listElement.innerHTML = '<tr><td colspan="3">No data found.</td></tr>';
    }
};

const fetchAdmins = () => {
    fetchData('Admins', adminList, (childSnapshot) => {
        const adminData = childSnapshot.val();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${adminData.name}</td>
            <td>${adminData.email}</td>
            <td>
                <button class="button approve-btn" onclick="editAdmin('${childSnapshot.key}', '${adminData.name}', '${adminData.email}')">Edit</button>
                <button class="button delete-btn" onclick="deleteAdmin('${childSnapshot.key}')">Delete</button>
            </td>
        `;
        adminList.appendChild(row);
    });
};

const fetchRequests = () => {
    fetchData('AdminRequests', requestList, (childSnapshot) => {
        const requestData = childSnapshot.val();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${requestData.name}</td>
            <td>${requestData.email}</td>
            <td>
                <button class="button approve-btn" onclick="approveRequest('${childSnapshot.key}', '${requestData.email}')">Approve</button>
                <button class="button delete-btn" onclick="deleteRequest('${childSnapshot.key}')">Delete</button>
            </td>
        `;
        requestList.appendChild(row);
    });
};

// Call fetchAdmins and fetchRequests on page load
fetchAdmins();
fetchRequests();

// Function to create a new admin
createAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form submission
    const name = adminNameInput.value;
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;

    if (validateAdminInput(name, email, password)) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const newAdminData = { name, email, uid };
            const newAdminRef = ref(database, `Admins/${uid}`); // Use uid as key
            
            // Save admin data to the database
            await set(newAdminRef, newAdminData);

            // Set custom claims for the admin
            const addAdminRole = httpsCallable(functions, 'addAdminRole');
            try {
                await addAdminRole({ uid });
            } catch (error) {
                console.error("Error setting custom claims:", error);
                alert("Failed to set admin role. Please try again.");
            }

            // Reset form fields
            adminNameInput.value = '';
            adminEmailInput.value = '';
            adminPasswordInput.value = '';

            alert("Admin created successfully!");
            fetchAdmins(); // Refresh the list
        } catch (error) {
            console.error("Error creating admin:", error);
            alert("Error creating admin: " + error.message);
        }
    }
});

// Function to validate admin input
const validateAdminInput = (name, email, password) => {
    if (!name || !email || !password) {
        alert("All fields are required.");
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }
    return true;
};

// Function to approve admin requests
window.approveRequest = async (requestId, email) => {
    const adminData = { name: email.split('@')[0], email }; // Placeholder for name
    const newAdminRef = ref(database, `Admins/${requestId}`); // Use requestId for admin data

    try {
        // Call the Cloud Function to set custom claims for the new admin
        const approveAdmin = httpsCallable(functions, 'approveAdmin');
        await approveAdmin({ uid: requestId });

        // Save admin data to the database
        await set(newAdminRef, adminData);
        
        await deleteRequest(requestId); // Remove the request after approval
        alert("Admin approved successfully!");
        fetchAdmins(); // Refresh admin list
    } catch (error) {
        console.error("Error approving request:", error);
        alert("Error approving admin: " + error.message);
    }
};

// Function to delete an admin request
window.deleteRequest = async (requestId) => {
    const requestRef = ref(database, `AdminRequests/${requestId}`);
    if (confirm("Are you sure you want to delete this request?")) {
        try {
            await remove(requestRef);
            fetchRequests(); // Refresh the requests list
        } catch (error) {
            console.error("Error deleting request:", error);
        }
    }
};

// Function to edit admin
window.editAdmin = (id, name, email) => {
    const newName = prompt("Enter new name:", name);
    const newEmail = prompt("Enter new email:", email);
    if (newName && newEmail) {
        updateAdminData(id, { name: newName, email: newEmail });
    }
};

// Function to update admin data in the database
const updateAdminData = (id, data) => {
    const adminRef = ref(database, `Admins/${id}`);
    set(adminRef, data).then(() => {
        fetchAdmins(); // Refresh the list
    }).catch(error => {
        console.error("Error updating admin:", error);
    });
};

// Function to delete admin
window.deleteAdmin = (id) => {
    const adminRef = ref(database, `Admins/${id}`);
    if (confirm("Are you sure you want to delete this admin?")) {
        remove(adminRef).then(() => {
            fetchAdmins(); // Refresh the list
        }).catch(error => {
            console.error("Error deleting admin:", error);
        });
    }
};
