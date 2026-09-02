/*
  Firebase initialization for the KennDev portfolio contact form.

  1. Replace the placeholder values below with YOUR project's config
     (Firebase Console → Project settings → General → Your apps → SDK setup and configuration).
  2. This file must load BEFORE script.js (already wired up in index.html).
  3. These values are safe to expose publicly — they identify your project,
     they are not secret credentials. Access is controlled by Firestore
     security rules (see firestore.rules), not by hiding this config.
*/

const firebaseConfig = {
  apiKey: "AIzaSyCCjeyus9QIU0Bmu5lsmUFNnIAf3Zeb-uU",
  authDomain: "contacts-2bf5a.firebaseapp.com",
  projectId: "contacts-2bf5a",
  storageBucket: "contacts-2bf5a.firebasestorage.app",
  messagingSenderId: "924776340530",
  appId: "1:924776340530:web:1e9f56346b521d128ff02b"
};

firebase.initializeApp(firebaseConfig);

// Exposed globally so script.js can use it without an import/bundler step.
window.db = firebase.firestore();