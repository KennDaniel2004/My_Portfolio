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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Exposed globally so script.js can use it without an import/bundler step.
window.db = firebase.firestore();
