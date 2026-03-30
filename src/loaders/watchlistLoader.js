import { redirect } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { fetchWatchedPools } from '../services/theGraphClient'
import { formatPoolData } from './utils/formatPoolData'

/**
 * Loader: Watchlist Page
 *
 * Two-phase fetch:
 *   1. Firestore  -> user's favorited pool IDs
 *   2. TheGraph   -> live pool data for those IDs (same shape as poolsLoader)
 *
 * Hard redirects to '/' if unauthenticated.
 * Short-circuits before TheGraph call if watchlist is empty.
 *
 * Note: auth.currentUser is synchronous and may be null on hard refresh
 * before Firebase resolves. Acceptable trade-off for portfolio scope.
 *
 * @returns {Promise<{ pools: Array<Object> } | Response>}
 */
export async function watchlistLoader() {
  // Hard redirect if unauthenticated
  if (auth.currentUser === null) return redirect('/')

  // Phase 1: Firestore -> pool IDs
  const snapshot = await getDocs(
    collection(db, 'users', auth.currentUser.uid, 'favorites')
  )
  const poolIds = snapshot.docs.map((doc) => doc.id)
  if (!poolIds.length) return { pools: [] }

  // Phase 2: TheGraph -> live pool data
  const raw = await fetchWatchedPools(poolIds)

  return { pools: formatPoolData(raw) }
}
