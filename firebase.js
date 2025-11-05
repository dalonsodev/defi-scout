import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "defi-scout.firebaseapp.com",
  projectId: "defi-scout",
  storageBucket: "defi-scout.firebasestorage.app",
  messagingSenderId: "631537599201",
  appId: "1:631537599201:web:c831a25a3cc327a6616da0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)