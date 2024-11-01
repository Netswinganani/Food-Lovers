import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-functions.js';

const setDefaultAdmin = async () => {
  const auth = getAuth();
  const database = getDatabase();
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'securepassword';

  try {
    // Check if the admin user already exists
    const signInMethods = await fetchSignInMethodsForEmail(auth, adminEmail);
    
    if (signInMethods.length > 0) {
      console.log('Default admin already exists.');
      return; // User already exists, no need to create again
    }

    // Create the admin user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    // Store user role in the database
    await set(ref(database, `Users/${user.uid}`), {
      email: adminEmail,
      role: 'admin'
    });

    // Set custom claim for the admin role
    const functions = getFunctions(getApp());
    const setCustomClaims = httpsCallable(functions, 'setCustomClaims');
    await setCustomClaims({ uid: user.uid, claims: { isAdmin: true } });

    console.log('Default admin created successfully with role admin.');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Default admin already exists.');
    } else if (error.code === 'auth/too-many-requests') {
      console.error('Too many requests. Please wait and try again later.');
    } else {
      console.error('Error creating admin:', error);
    }
  }
};

export default setDefaultAdmin;
