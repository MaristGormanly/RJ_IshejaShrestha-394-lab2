import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper function to create direct download URLs that bypass CORS
const createDirectDownloadUrl = (path) => {
  if (!path) return null;
  
  // Get the bucket from Firebase config or storage options
  const bucket = storage.app.options.storageBucket || firebaseConfig.storageBucket || 'landed-41df2.appspot.com';
  
  // Convert the path to a URL-safe string
  const encodedPath = encodeURIComponent(path);
  
  // Create a proxied URL that handles CORS
  const directUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  return `/firebase-storage-proxy${new URL(directUrl).pathname}${new URL(directUrl).search}`;
};

export { auth, db, storage, createDirectDownloadUrl }; 