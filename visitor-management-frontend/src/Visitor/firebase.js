//firebase.js
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAiyhWydE9322coXthX2B60TzHTYCM7yRQ",
    authDomain: "vms-otp-e7770.firebaseapp.com",
    projectId: "vms-otp-e7770",
    storageBucket: "vms-otp-e7770.firebasestorage.app",
    messagingSenderId: "127486579942",
    appId: "1:127486579942:web:0ac764469f5bafce11d727"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

export { auth };
