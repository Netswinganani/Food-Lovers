import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js'; 
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js'; 
import { storage, database } from './firebase.js';  // Your Firebase configuration

document.getElementById('contact-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form data
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value;
    const message = document.getElementById('message').value;
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];

    try {
        // Upload file to Firebase Storage
        let fileUrl = '';
        if (file) {
            const fileRef = storageRef(storage, `uploads/${file.name}`);
            await uploadBytes(fileRef, file);
            fileUrl = await getDownloadURL(fileRef);
        }

        // Store form data in Firebase Database
        const contactRef = ref(database, 'contactUs');
        const newContactRef = push(contactRef);
        await set(newContactRef, {
            firstName,
            lastName,
            email,
            mobile,
            message,
            fileUrl
        });

        showAlert('Your message has been sent successfully!'); // Confirmation message
        document.getElementById('contact-form').reset(); // Reset the form

    } catch (error) {
        console.error('Error uploading data:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

// Function to show alerts
function showAlert(message, type) {
  const alertBox = document.createElement('div');
  alertBox.className = `alert-box ${type === 'success' ? 'show' : ''}`;
  alertBox.innerHTML = `
      <img src="${type === 'success' ? 'success-icon.png' : 'error-icon.png'}" class="alert-img" alt="${type} icon">
      <div class="alert-msg">${message}</div>
  `;
  document.body.appendChild(alertBox);

  // Show alert box
  setTimeout(() => {
      alertBox.classList.add('show');
  }, 100); // Delay for transition effect

  // Remove alert after a few seconds
  setTimeout(() => {
      alertBox.classList.remove('show');
      alertBox.remove(); // Remove from DOM
  }, 4000); // Show for 4 seconds
}

// Function to clear existing alerts
function clearAlert() {
  const existingAlerts = document.querySelectorAll('.alert-box');
  existingAlerts.forEach(alert => alert.remove());
}