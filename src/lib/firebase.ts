// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- 1. IMPORT STORAGE

// Securely load keys from your .env.local file
const firebaseConfig = {
  apiKey: "AIzaSyDdvugJKhgaXKM-CUxLa5ESvGFMQHVlKYk", // Your key
  authDomain: "qc-validator-b8215.firebaseapp.com",
  projectId: "qc-validator-b8215",
  storageBucket: "qc-validator-b8215.firebase.storage.app", // Fixed bucket URL
  messagingSenderId: "486562431642",
  appId: "1:486562431642:web:577d4da51b7aebc769523"
};

// --- ROBUST INITIALIZATION ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- EXPORT ALL SERVICES ---
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // <-- 2. INITIALIZE AND PREPARE STORAGE FOR EXPORT

export { app, auth, db, storage }; // <-- 3. EXPORT STORAGE ALONG WITH OTHERS