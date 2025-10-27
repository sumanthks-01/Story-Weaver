# Firestore Security Rules Setup

Your Firebase project needs proper security rules to allow read/write access. 

## Current Issue
The app shows "Offline Mode" because Firestore security rules are blocking access.

## Fix: Update Firestore Rules

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: story-weaver-fd57d
3. **Go to Firestore Database**
4. **Click "Rules" tab**
5. **Replace the rules with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to stories collection
    match /stories/{document} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"**

## Alternative: Test Mode Rules (30 days)

For quick testing, use these rules (expires in 30 days):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 12, 31);
    }
  }
}
```

## Verify Fix

After updating rules:
1. Refresh your Story Weaver app
2. The "Offline Mode" notice should disappear
3. Stories will sync across all users in real-time

## Security Note

The rules above allow anyone to read/write. For production, consider adding authentication and user-specific rules.