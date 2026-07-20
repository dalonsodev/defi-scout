import { collection, getDocs } from 'firebase/firestore'
import { redirect } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { fetchWatchedPools } from '../services/theGraphClient'
import { FormattedPool } from '../types'
import { formatPoolData } from './utils/formatPoolData'

interface WatchlistLoaderSuccess {
  pools: FormattedPool[]
}

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
 * @returns Formatted pool data or hard redirect to '/'
 */
export async function watchlistLoader(): Promise<WatchlistLoaderSuccess | Response> {
  // Hard redirect if unauthenticated
  if (auth.currentUser === null) return redirect('/')

  // Phase 1: Firestore -> pool IDs
  const snapshot = await getDocs(collection(db, 'users', auth.currentUser.uid, 'favorites'))
  const poolIds = snapshot.docs.map((doc) => doc.id)
  if (!poolIds.length) return { pools: [] }

  // Phase 2: TheGraph -> live pool data
  const raw = await fetchWatchedPools(poolIds)

  return { pools: formatPoolData(raw) }
}
