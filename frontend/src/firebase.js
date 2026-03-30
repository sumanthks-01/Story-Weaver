import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let db;

const requiredKeys = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length === 0) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization failed.');
  }
} else {
  console.warn('Firebase env vars not set. Running in offline mode.');
}

export { db };