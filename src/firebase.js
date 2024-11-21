// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKvVaBPx-ExgIyzZd90oH9gBjefvTQRcM",
  authDomain: "test-db8b8.firebaseapp.com",
  projectId: "test-db8b8",
  storageBucket: "test-db8b8.firebasestorage.app",
  messagingSenderId: "210720540943",
  appId: "1:210720540943:web:139462a95934992e1bd67a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
