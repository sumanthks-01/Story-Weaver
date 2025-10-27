import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyACnbQIHNnb5QFAdTQ02QXkCYi5tf2J9eM",
  authDomain: "story-weaver-fd57d.firebaseapp.com",
  projectId: "story-weaver-fd57d",
  storageBucket: "story-weaver-fd57d.firebasestorage.app",
  messagingSenderId: "14253655734",
  appId: "1:14253655734:web:08465275a9aed953314817"
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { db };