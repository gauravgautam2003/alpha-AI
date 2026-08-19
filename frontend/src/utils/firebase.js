// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "alpha-ai-bf149.firebaseapp.com",
  projectId: "alpha-ai-bf149",
  storageBucket: "alpha-ai-bf149.firebasestorage.app",
  messagingSenderId: "870306445877",
  appId: "1:870306445877:web:1170d5284ae15224aecf7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();