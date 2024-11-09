import { getAuth, sendEmailVerification, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { app } from './firebase.js'; // Ensure this path is correct

const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', async () => {
  const user = auth.currentUser || JSON.parse(sessionStorage.getItem('user'));

  if (!user || !user.uid) {
    console.error('No user found.');
    alert('No user found. Please sign in.');
    return;
  }

  try {
    const userRef = ref(database, `Users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      document.getElementById('user-name').textContent = userData.name || 'N/A';
      document.getElementById('user-email').textContent = userData.email || 'N/A';

      // Handle address formatting
      if (userData.address) {
        const address = userData.address;
        document.getElementById('user-address').textContent =
          `${address.street || 'N/A'}, ${address.city || 'N/A'}, ${address.country || 'N/A'}, ${address.zip || 'N/A'}`;
      } else {
        document.getElementById('user-address').textContent = 'N/A';
      }

      document.getElementById('update-name').value = userData.name || '';
      document.getElementById('update-email').value = userData.email || '';
      
      // Pre-fill address fields
      document.getElementById('update-address-street').value = userData.address ? userData.address.street || '' : '';
      document.getElementById('update-address-city').value = userData.address ? userData.address.city || '' : '';
      document.getElementById('update-address-country').value = userData.address ? userData.address.country || '' : '';
      document.getElementById('update-address-zip').value = userData.address ? userData.address.zip || '' : '';
    } else {
      console.error('No user data found.');
    }
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    alert('Error fetching user data: ' + error.message);
  }
});

document.getElementById('update-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const user = auth.currentUser || JSON.parse(sessionStorage.getItem('user'));

  if (!user || !user.uid) {
    console.error('No user found.');
    alert('No user found. Please sign in.');
    return;
  }

  const updatedData = {
    name: document.getElementById('update-name').value,
    email: document.getElementById('update-email').value,
    address: {
      street: document.getElementById('update-address-street').value,
      city: document.getElementById('update-address-city').value,
      country: document.getElementById('update-address-country').value,
      zip: document.getElementById('update-address-zip').value
    }
  };

  // Capture the current password, new password, and confirm password fields
  const currentPassword = document.getElementById('current-password').value;  // Get current password input
  const newPassword = document.getElementById('new-password').value;  // Get new password input
  const confirmPassword = document.getElementById('confirm-password').value;  // Get confirm password input

  if (newPassword && newPassword !== confirmPassword) {
    alert('New passwords do not match!');
    return;
  }

  try {
    // If the email is verified, proceed with updates
    if (user.emailVerified) {
      // If user wants to change their password, reauthenticate first
      if (currentPassword && newPassword) {
        // Create email credential using current email and current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        // Attempt reauthentication
        await reauthenticateWithCredential(user, credential);
        
        // Update password after reauthentication
        await updatePassword(user, newPassword);
        alert('Password updated successfully!');
      }

      // If the user is updating the email
      const newEmail = updatedData.email;
      if (user.email !== newEmail) {
        // Reauthenticate for email update if the email is being changed
        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        try {
          await reauthenticateWithCredential(user, credential);  // Reauthenticate the user
          // Update the email address after reauthentication
          await updateEmail(user, newEmail);
          alert('Email updated successfully!');
        } catch (error) {
          console.error('Reauthentication failed:', error.message);
          alert('Reauthentication failed. Please check your current password and try again.');
        }
      }

      // After email and password updates (if any), update user data in the Firebase Realtime Database
      await update(ref(database, `Users/${user.uid}`), updatedData);
      alert('Profile updated successfully!');

      // Optionally refresh the page to show updated data
      location.reload();
    } else {
      // Email is not verified, ask the user to verify
      alert('Please verify your email address before updating it.');
      await sendEmailVerification(user);
      alert('A verification email has been sent. Please verify your email before updating your profile.');
    }
  } catch (error) {
    console.error('Error updating profile:', error.message);
    alert('Error updating profile: ' + error.message);
  }
});
