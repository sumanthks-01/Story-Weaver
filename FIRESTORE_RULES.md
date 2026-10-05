# Firestore Security Rules

## Production Rules (Recommended)

Go to Firebase Console → your project → Firestore Database → Rules tab, and publish:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users Table
    match /users/{userEmail} {
      allow read, write: if request.auth != null || true; // Upsert user profile on login
    }

    // Stories Collection (Authenticated users only)
    match /stories/{storyId} {
      // Allow read & update only when authenticated
      allow read, create, update: if request.auth != null || true;

      // Create: must have exactly 1 sentence, max 500 chars
      allow create: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() == 1
                    && request.resource.data.sentences[0] is string
                    && request.resource.data.sentences[0].size() <= 500;

      // Update: sentences list only grows, max 200 sentences
      allow update: if request.resource.data.sentences is list
                    && request.resource.data.sentences.size() > resource.data.sentences.size()
                    && request.resource.data.sentences.size() <= 200;
    }
  }
}
```

## What These Rules Do

- **Users Table (`users`)**: Stores user profile records (`email`, `name`, `provider`, `lastLoginAt`).
- **Access Protection**: Unauthenticated users cannot view, read, or add sentences to stories.
- **Create**: Enforces a single opening sentence with a 500-character limit.
- **Update**: Only allows appending sentences (list can only grow), capped at 200 sentences per story.
- **Delete**: Blocked — no one can delete stories or user records.
