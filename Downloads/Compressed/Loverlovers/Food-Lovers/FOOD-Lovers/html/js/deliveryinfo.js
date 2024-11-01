// Import necessary Firebase modules
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { app } from './firebase.js'; // Ensure this file initializes and exports the Firebase app instance

const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  // Retrieve address from localStorage
  const street = localStorage.getItem('selectedStreet');
  const city = localStorage.getItem('selectedCity');
  const zip = localStorage.getItem('selectedZip');
  const country = localStorage.getItem('selectedCountry');

  // Populate form fields with values from localStorage
  if (street) document.getElementById('street').value = street;
  if (city) document.getElementById('city').value = city;
  if (zip) document.getElementById('zip').value = zip;
  if (country) document.getElementById('country').value = country;
});

document.getElementById('delivery-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get the currently signed-in user
  const user = auth.currentUser;

  if (!user || !user.uid) {
    alert('No user found. Please sign in.');
    console.error('No user found.');
    return;
  }

  const address = {
    street: document.getElementById('street').value,
    city: document.getElementById('city').value,
    zip: document.getElementById('zip').value,
    country: document.getElementById('country').value,
    lat: localStorage.getItem('selectedLat'),
    lng: localStorage.getItem('selectedLng')
  };

  try {
    console.log('Updating address:', address); // Debugging line
    await set(ref(database, `Users/${user.uid}/address`), address);
    // Redirect to payment page
    window.location.href = 'payment.html';
  } catch (error) {
    console.error('Error updating address:', error.message);
    alert('Error updating address: ' + error.message);
  }
});
