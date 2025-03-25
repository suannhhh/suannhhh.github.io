// Firebase configuration
const firebaseConfig = {
  apiKey: "_",
  authDomain: "",
  projectId: "-",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get a reference to the firestore service
const db = firebase.firestore();
