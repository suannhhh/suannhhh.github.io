// Template Firebase configuration
// IMPORTANT: Rename this file to firebase-config.js and fill in your actual Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyC35SC0nF0uKrUXh_JAqCJ6WsfV4jzGHKE",
  authDomain: "rsvp-8fc6b.firebaseapp.com",
  projectId: "rsvp-8fc6b",
  storageBucket: "rsvp-8fc6b.firebasestorage.app",
  messagingSenderId: "375382418485",
  appId: "1:375382418485:web:95cfa60c94dfea0844bd7c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the firestore service
const db = firebase.firestore();
