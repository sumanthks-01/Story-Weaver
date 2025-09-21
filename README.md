# Story Weaver 📖

A collaborative fiction web app where users write stories together, one sentence at a time. Each contributor only sees the most recent sentence, creating surprising plot twists!

## 🚀 Live Demo

Visit: [https://yourusername.github.io/story-weaver](https://yourusername.github.io/story-weaver)

## Features

- Start new collaborative stories
- Add sentences to existing stories (seeing only the latest sentence)
- View complete stories
- Simple, clean interface
- Works offline with localStorage

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Deploy to GitHub Pages:**
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

Stories are saved in your browser's localStorage, so they persist between sessions on the same device.

## Tech Stack

- **Frontend**: React
- **Storage**: localStorage (browser-based)
- **Hosting**: GitHub Pages

## Files to Ignore (.gitignore)

The following files are automatically ignored:
- `node_modules/` - Dependencies
- `frontend/build/` - Build output
- `.env*` - Environment files
- IDE and OS specific files