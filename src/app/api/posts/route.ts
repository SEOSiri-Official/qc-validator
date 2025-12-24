import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

// Helper to get or initialize the Firebase Admin app
const initFirebaseAdmin = () => {
  // 1. Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // 2. Initialize if not
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Key file missing at ${serviceAccountPath}`);
    }
    
    const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(fileContents);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin Init Failed:', error);
    return null;
  }
};

export async function GET() {
  const app = initFirebaseAdmin();

  if (!app) {
    return NextResponse.json({ error: 'Server Configuration Error: Firebase Init Failed' }, { status: 500 });
  }

  const db = getFirestore(app);

  try {
    const postsCollection = db.collection('press_releases');
    const postSnapshot = await postsCollection.orderBy('publishedAt', 'desc').get();
    
    const posts = postSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?._seconds || null
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch posts from DB' }, { status: 500 });
  }
}