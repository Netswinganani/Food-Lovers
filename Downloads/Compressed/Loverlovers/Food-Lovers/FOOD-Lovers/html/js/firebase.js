// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, set,update, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';
import setDefaultAdmin from './setDefaultAdmin.js'; // Ensure the import is correct

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB4bxB4CYFMmATPh7y2NGZ2ekuYLwAdp4",
  authDomain: "xisd2-152cb.firebaseapp.com",
  databaseURL: "https://xisd2-152cb-default-rtdb.firebaseio.com",
  projectId: "xisd2-152cb",
  storageBucket: "xisd2-152cb.appspot.com",
  messagingSenderId: "1062892002792",
  appId: "1:1062892002792:web:185f1bf22bfb9002e1185d",
  measurementId: "G-WB4FHB1RTT"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and Auth
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Call the function to set up the default admin after initializing Firebase
setDefaultAdmin()
  .then(() => {
    console.log('Admin setup completed.');
  })
  .catch(error => {
    console.error('Error setting up admin:', error);
  });
  
// Export the instances
export { database, app,auth, update,storage,createUserWithEmailAndPassword, signInWithEmailAndPassword, get,ref   };

// Set data example
const setData = async (path, data) => {
  try {
    await set(ref(database, path), data);
    console.log("Data set successfully!");
  } catch (error) {
    console.error("Error setting data:", error);
  }
};

// Get data example
const getData = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      console.log("Data retrieved:", snapshot.val());
    } else {
      console.log("No data available.");
    }
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
};
