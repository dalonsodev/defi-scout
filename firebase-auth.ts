import { getAuth } from 'firebase/auth'
import { app } from './firebase-app'

/**
 * Firebase Authentication instance.
 * Import this in components instead of calling getAuth() multiple times.
 */
export const auth = getAuth(app)
