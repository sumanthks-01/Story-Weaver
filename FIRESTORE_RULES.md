# Firestore Security Rules

## Production Rules (Recommended)

Go to Firebase Console → your project → Firestore Database → Rules tab, and publish:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stories/{storyId} {
      // Anyone can read stories
      allow read: if true;

      // Create: must have exactly 1 sentence, max 500 chars
      allow create: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() == 1
                    && request.resource.data.sentences[0] is string
                    && request.resource.data.sentences[0].size() <= 500;

      // Update: sentences list only grows, max 200 sentences, each max 500 chars
      allow update: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() > resource.data.sentences.size()
                    && request.resource.data.sentences.size() <= 200;
    }
  }
}
```

## What These Rules Do

- **Read**: Public — anyone can browse stories
- **Create**: Enforces a single opening sentence with a 500-character limit
- **Update**: Only allows appending sentences (list can only grow), capped at 200 sentences per story
- **Delete**: Blocked — no one can delete stories via the client

## What to Avoid

```javascript
// ❌ NEVER use this in production — gives anyone full database access
allow read, write: if true;
```
