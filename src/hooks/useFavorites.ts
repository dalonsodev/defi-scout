import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../../firebase'
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

interface UseFavoritesResult {
  favoriteIds: Set<string>
  toggleFavorite: (poolId: string) => Promise<void>
  isLoggedIn: boolean
}

/**
 * Custom Hook: Fetch watchlist favorites from a user's collection (Firebase)
 */
export function useFavorites(): UseFavoritesResult {
  const { currentUser, openAuthModal } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  /**
   * Data Fetching: User-saved pools from Firebase.
   *
   * Fetches poolIds from the user's collection to be consumed by
   * PoolTable, PoolDetail, and Watchlist page.
   */
  useEffect(() => {
    if (currentUser === null) return
    if (!currentUser) {
      setFavoriteIds(new Set())
      return
    }
    let cancelled = false

    const fetchFavorites = async (): Promise<void> => {
      const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites')
      const querySnapshot = await getDocs(favoritesRef)
      const poolIds = new Set(querySnapshot.docs.map((doc) => doc.id))

      if (!cancelled) {
        setFavoriteIds(poolIds)
      }
    }

    fetchFavorites()
    // Cleanup: Prevents state update on unmounted component
    return () => {
      cancelled = true
    }
  }, [currentUser])

  /**
   * Toggles a pool's favorite status in Firestore and updates local Set optimistically.
   * Opens the auth modal if the user is not authenticated.
   *
   * Note: Optimistic update - local Set changes before Firestore confirms.
   * If the Firestore write fails, Set might be out of sync until next fetch.
   *
   * @param poolId - Pool contract address, used as the Firestore document ID
   */
  const toggleFavorite = async (poolId: string): Promise<void> => {
    if (!currentUser) {
      openAuthModal()
      return
    }
    const docRef = doc(db, 'users', currentUser.uid, 'favorites', poolId)

    if (favoriteIds.has(poolId)) {
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(poolId)
        return next
      })
      await deleteDoc(docRef)
    } else {
      setFavoriteIds((prev) => new Set([...prev, poolId]))
      await setDoc(docRef, { poolId, addedAt: serverTimestamp() })
    }
  }

  return { favoriteIds, toggleFavorite, isLoggedIn: !!currentUser }
}
