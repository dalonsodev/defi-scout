import { app } from '../../firebase-app'
import type {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'

interface ImportFirebase {
  collection: typeof collection
  deleteDoc: typeof deleteDoc
  doc: typeof doc
  getDocs: typeof getDocs
  serverTimestamp: typeof serverTimestamp
  setDoc: typeof setDoc
  getFirestore: typeof getFirestore
  db: Firestore
}

export const importFirebase = async (): Promise<ImportFirebase> => {
  const firestoreModule = await import('firebase/firestore')

  const { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, getFirestore } =
    firestoreModule
  const db = getFirestore(app)

  return { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, getFirestore, db }
}
