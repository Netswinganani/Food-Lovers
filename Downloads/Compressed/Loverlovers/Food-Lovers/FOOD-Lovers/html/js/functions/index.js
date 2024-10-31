const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true }); // Allow all origins
const { getDatabase, ref, set } = require('firebase-admin/database');
const crypto = require('crypto');

admin.initializeApp();

const generateRandomPassword = (length = 12) => {
    return crypto.randomBytes(length).toString('hex'); // Generates a random password
};

exports.approveAdminRequest = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(403).send('Forbidden!');
        }

        // Check if the user is authenticated and has admin privileges
        if (!req.auth || req.auth.token.admin !== true) {
            return res.status(403).send('Must be an admin to perform this action.');
        }

        const { uid, requestId, adminData } = req.body; // Destructure required fields
        const password = generateRandomPassword(); // Generate a secure password

        try {
            // Create new admin user
            const userRecord = await admin.auth().createUser({
                email: adminData.email,
                password: password,
                displayName: adminData.name,
            });

            // Set custom claims for the new admin
            await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

            // Save the admin information in your database
            await set(ref(getDatabase(), `Admins/${userRecord.uid}`), {
                email: adminData.email,
                role: 'admin'
            });

            // Mark the request as approved
            await set(ref(getDatabase(), `AdminRequests/${requestId}/status`), 'approved');

            // Optional: Send the password to the new admin via email
            // Implement your email sending logic here

            res.status(200).send({ message: `Success! ${adminData.name} has been created as an admin.` });
        } catch (error) {
            console.error('Error creating admin:', error);
            res.status(500).send({ error: 'Error approving admin' });
        }
    });
});
