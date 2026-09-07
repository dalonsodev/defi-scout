import { getFirestore } from 'firebase/firestore'
import { app } from './firebase-app'

/**
 * Singleton: Firestore Database instance.
 * Import this in components instead of calling getFirestore() multiple times.
 */
export const db = getFirestore(app)
