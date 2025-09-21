# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "story-weaver" (or any name)
4. Disable Google Analytics (not needed)
5. Click "Create project"

## 2. Setup Firestore Database

1. In your Firebase project, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (allows read/write for 30 days)
4. Select a location (choose closest to your users)
5. Click "Done"

## 3. Get Firebase Config

1. Click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app with nickname "story-weaver-web"
5. Copy the `firebaseConfig` object

## 4. Update Your App

Replace the config in `frontend/src/firebase.js`:

```javascript
const firebaseConfig = {
  // Paste your actual config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 5. Deploy

```bash
npm run install-all
npm run deploy
```

Your app will now use Firebase for real-time collaborative storage!