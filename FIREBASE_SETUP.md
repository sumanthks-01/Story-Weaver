# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project", name it, disable Google Analytics
3. Click "Create project"

## 2. Enable Firestore

1. In your project, click "Firestore Database" → "Create database"
2. Choose **production mode** (not test mode)
3. Select a region close to your users → "Done"
4. Set security rules — see [FIRESTORE_RULES.md](./FIRESTORE_RULES.md)

## 3. Get Your Config Values

1. Click the gear icon → "Project settings"
2. Scroll to "Your apps" → click the web icon `</>`
3. Register the app with a nickname (e.g. `story-weaver-web`)
4. Copy the values from the `firebaseConfig` object shown

> Never share or commit these values — treat them like passwords.

## 4. Set Environment Variables

```bash
cd frontend
cp .env.example .env.local
```

Open `frontend/.env.local` and fill in each value from step 3:

```
REACT_APP_FIREBASE_API_KEY=<your apiKey>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your authDomain>
REACT_APP_FIREBASE_PROJECT_ID=<your projectId>
REACT_APP_FIREBASE_STORAGE_BUCKET=<your storageBucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your messagingSenderId>
REACT_APP_FIREBASE_APP_ID=<your appId>
```

> `.env.local` is listed in `.gitignore` — it will never be committed to version control.

## 5. Run the App

```bash
npm run install-all
npm run dev
```

## Deploying (GitHub Pages / CI)

Do **not** put real credentials in any committed file. Instead, add each `REACT_APP_*` variable as a secret in your CI environment (e.g. GitHub Actions → Settings → Secrets) and inject them at build time.
