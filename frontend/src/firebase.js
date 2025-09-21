import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
// Import the functions you need from the SDKs you need
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACnbQIHNnb5QFAdTQ02QXkCYi5tf2J9eM",
  authDomain: "story-weaver-fd57d.firebaseapp.com",
  projectId: "story-weaver-fd57d",
  storageBucket: "story-weaver-fd57d.firebasestorage.app",
  messagingSenderId: "14253655734",
  appId: "1:14253655734:web:08465275a9aed953314817"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);