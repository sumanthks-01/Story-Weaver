# Story Weaver 📖

A collaborative fiction web app where users write stories together, one sentence at a time. Each contributor only sees the most recent sentence, creating surprising plot twists!

## 🚀 Live Demo

Visit: [https://weaver.sumanthaks.dev](https://weaver.sumanthaks.dev)

## Features

- **Real-time collaboration** - Multiple users can contribute simultaneously
- Start new collaborative stories
- Add sentences to existing stories (seeing only the latest sentence)
- View complete stories
- **Cloud storage** - Stories are saved in Firebase and accessible to everyone
- Simple, clean interface

## Quick Start

1. **Setup Firebase** (see FIREBASE_SETUP.md for detailed guide):
   - Create Firebase project
   - Enable Firestore
   - Update config in `frontend/src/firebase.js`

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## GitHub Pages Setup

1. **Update homepage in `frontend/package.json`:**
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Enable GitHub Pages:**
   - Go to your repo Settings → Pages
   - Select "gh-pages" branch as source

## How It Works

1. **Start a Story**: Create a new story with an opening sentence
2. **Continue Stories**: Select an active story, see only the latest sentence, and add your own
3. **Read Complete Stories**: View the full collaborative story once it's built up

Stories are saved in Firebase Firestore, making them accessible to all users in real-time.

## Tech Stack

- **Frontend**: React
- **Database**: Firebase Firestore
- **Hosting**: GitHub Pages
- **Real-time**: Firebase real-time updates

## Files to Ignore (.gitignore)

The following files are automatically ignored:
- `node_modules/` - Dependencies
- `frontend/build/` - Build output
- `.env*` - Environment files
- IDE and OS specific files
