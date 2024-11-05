import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
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

  try {
    await update(ref(database, `Users/${user.uid}`), updatedData);
    alert('Profile updated successfully!');
    
    // Optionally refresh the page to show updated data
    location.reload();
  } catch (error) {
    console.error('Error updating profile:', error.message);
    alert('Error updating profile: ' + error.message);
  }
});
