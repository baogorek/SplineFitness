import { getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCVZ2fdx6ak4KOZ8Ai4hMfrsb8avnsHAnc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "spline-fitness.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "spline-fitness",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "spline-fitness.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "355505565580",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:355505565580:web:39b6929a528ef1fd5b70a9",
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const firebaseApp = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null
