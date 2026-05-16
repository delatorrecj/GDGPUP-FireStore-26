// ============================================
// FIREBASE WEB SDK CONFIGURATION
// ============================================
// To get your config values:
// 1. Go to Firebase Console (console.firebase.google.com)
// 2. Select your project
// 3. Click the gear icon → Project Settings
// 4. Scroll to "Your apps" → Find your Web app
// 5. Copy the config object below
//
// IMPORTANT: You MUST:
//   a) Fill this in for login/signup to work!
//   b) ENABLE Firebase Authentication in the Console:
//      - Go to Build → Authentication
//      - Click "Get started"
//      - Enable "Email/Password" provider
// ============================================

// REPLACE THIS ENTIRE OBJECT with your Firebase config
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDG6BzGabV14n9slAeGU9HOmabuQEYUAsA",
  authDomain: "sj-6-firestore.firebaseapp.com",
  projectId: "sj-6-firestore",
  storageBucket: "sj-6-firestore.firebasestorage.app",
  messagingSenderId: "96223569390",
  appId: "1:96223569390:web:c49c74ba6b7423fdf29aff",
  measurementId: "G-NTHTBWGZ1E",
};

// Debug: Log if config is set
if (window.FIREBASE_CONFIG.apiKey === "YOUR_API_KEY_HERE") {
  console.warn("⚠️ Firebase config not set up! Login/signup will not work.");
  console.log("Update firebase-config.js with your Firebase Web SDK config.");
} else {
  console.log("✓ Firebase config loaded");
  console.log("If you see 'auth/configuration-not-found' error:");
  console.log("  1. Go to Firebase Console → sj-6-firestore project");
  console.log("  2. Click Build → Authentication");
  console.log("  3. Click 'Get started' and enable 'Email/Password'");
}

