import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Check if the app is already initialized
if (!admin.apps.length) {
  try {
    // Parse the service account key from the environment variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.stack);
  }
}

export const db = getFirestore();