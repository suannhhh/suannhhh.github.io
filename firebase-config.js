// Firebase configuration
const firebaseConfig = {
  apiKey: "AIza",
  authDomain: "",
  projectId: "r",
  storageBucket: "",
  messagingSenderId: "",
  appId: "
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the firestore service
const db = firebase.firestore();