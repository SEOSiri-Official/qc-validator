import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Assumes serviceAccountKey.json is in the project's root directory
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize only if it hasn't been done already
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase Admin Init Error:', error.stack);
  }
}

// Export the initialized admin instance and the firestore database
const db = getFirestore();

export { admin, db };