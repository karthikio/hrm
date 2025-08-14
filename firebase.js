// firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4TjzohLiuNwu0CMFjjCqEF74sUg4s9qM",
  authDomain: "hrm-cube.firebaseapp.com",
  projectId: "hrm-cube",
  storageBucket: "hrm-cube.firebasestorage.app",
  messagingSenderId: "863410648848",
  appId: "1:863410648848:web:139a917dbd27816540d795"
};


const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app); 
export const db = getFirestore(app);