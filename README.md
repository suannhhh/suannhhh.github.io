# RSVP Application

A simple event management application that allows hosts to create events and guests to RSVP.

## Setup Instructions

### Firebase Configuration

This application uses Firebase for data storage. To set up the Firebase configuration:

1. Rename `firebase-config.template.js` to `firebase-config.js`
2. Edit `firebase-config.js` with your actual Firebase credentials
3. Make sure not to commit `firebase-config.js` to version control (it's already in `.gitignore`)

Example:
```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### GitHub Pages Deployment

When deploying to GitHub Pages, you'll need to set up your Firebase configuration without exposing your API keys. There are two recommended approaches:

#### Option 1: Environment Variables with GitHub Actions (Recommended)

1. Store your Firebase credentials as [GitHub repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
2. Create a GitHub Actions workflow that generates the `firebase-config.js` file during the build process
3. Deploy the built application to GitHub Pages

#### Option 2: Firebase Hosting (Alternative)

Instead of using GitHub Pages, consider using Firebase Hosting:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase Hosting: `firebase init hosting`
3. Deploy to Firebase Hosting: `firebase deploy --only hosting`

This method automatically handles API keys securely.

## Features

- Create events with custom details
- Upload guest lists directly from Excel/CSV files
- Secure host access with custom access codes
- Track guest RSVPs in real-time
- Export guest lists with RSVP statuses