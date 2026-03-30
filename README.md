# Story Weaver 📖

A collaborative fiction web app where users build stories together, one sentence at a time. Each contributor sees only the most recent sentence — creating unexpected plot twists.

## Features

- Start new collaborative stories
- Contribute to existing stories (only the latest sentence is shown)
- Read complete stories
- Dark/light mode
- Firebase Firestore for real-time cloud sync, with localStorage fallback

## Tech Stack

- **Frontend**: React 18
- **Database**: Firebase Firestore
- **Hosting**: Vercel
- **Backend** (optional): Node.js + Express

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/story-weaver.git
cd story-weaver
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Firestore Database** (start in production mode)
3. Register a web app and copy the config values
4. Set Firestore security rules (see [Security Rules](#firestore-security-rules) below)

### 3. Configure environment variables

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` and fill in your Firebase config values:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

> `.env.local` is git-ignored and will never be committed.

### 4. Install dependencies and run

```bash
# From the project root
npm run install-all
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Deploying to Vercel

### One-time setup

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Vercel will auto-detect `vercel.json` — no framework config needed
4. Add each environment variable in Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | your Firebase API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | your auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | your project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | your storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | your sender ID |
| `REACT_APP_FIREBASE_APP_ID` | your app ID |

5. Click Deploy

> Never put real credentials in `vercel.json` or any committed file. Vercel injects env vars at build time securely.

### Subsequent deploys

Every push to `main` triggers an automatic redeploy on Vercel.

---

## Firestore Security Rules

Replace the default rules in Firebase Console → Firestore → Rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stories/{storyId} {
      // Anyone can read stories
      allow read: if true;
      // Only allow writes with valid data
      allow create: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() == 1
                    && request.resource.data.sentences[0] is string
                    && request.resource.data.sentences[0].size() <= 500;
      allow update: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() <= 200;
    }
  }
}
```

> Never use `allow read, write: if true` in production — it gives anyone full access to your database.

---

## Backend (Optional)

The frontend works standalone with Firebase. The Express backend in `backend/` is an optional REST API layer.

```bash
cd backend
cp .env.example .env
# Edit .env with your PORT and ALLOWED_ORIGIN
node server.js
```

---

## Project Structure

```
story-weaver/
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   ├── firebase.js     # Firebase init (reads from env vars)
│   │   └── App.css
│   ├── public/
│   └── .env.example        # Template — copy to .env.local
├── backend/
│   ├── server.js           # Express API
│   └── .env.example        # Template — copy to .env
├── .gitignore
└── README.md
```

---

## Security Notes

- Firebase credentials are loaded from environment variables — never hardcoded
- `.env.local` and `.env` are git-ignored
- Firestore rules restrict write operations to valid data shapes
- Backend validates and sanitizes all input, restricts CORS to known origins
- Sentences are capped at 500 characters
