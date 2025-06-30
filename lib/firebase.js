// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvNApq9-UgIfmZC0LOqacglEEUJUYq2NU",
  authDomain: "custom-mock.firebaseapp.com",
  projectId: "custom-mock",
  storageBucket: "custom-mock.firebasestorage.app",
  messagingSenderId: "398499503782",
  appId: "1:398499503782:web:af2f9d6f551f0075ea1e67",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
