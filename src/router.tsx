import {
  createBrowserRouter,
  createRoutesFromElements,
  Route
} from 'react-router-dom'
import Pools from './pages/Pools'
import Watchlist from './pages/Watchlist'
import { Layout } from './components/layout/Layout'
import { FavoritesLayout } from './components/layout/FavoritesLayout'
import { Error } from './components/common/Error'
import { poolsLoader } from './loaders/poolsLoader'
import { poolDetailLoader } from './loaders/poolDetailLoader'
import { watchlistLoader } from './loaders/watchlistLoader'

/**
 * Application Router: React Router 6.4+ (with loader-based data fetching)
 *
 * Architecture Decision: Uses loaders for data fetching (render-as-you-fetch).
 * Loaders execute before component rendering, eliminating useEffect waterfalls.
 *
 * Key Patterns:
 * - Blocking loaders: Both poolsLoader and poolDetailLoader use await,
 *   guaranteeing data is ready before first render (no loading skeletons needed)
 * - Route-level code splitting: PoolDetail loads lazily via lazy(),
 *   reducing initial bundle size for the /pools entry point
 * - Scoped error boundaries: poolDetailLoader has dedicated errorElement to isolate
 *   GraphQL failures without breaking the rest of the app
 */
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route element={<FavoritesLayout />}>
        <Route
          path="pools/:poolId"
          lazy={async () => {
            const module = await import('./components/pool-detail/PoolDetail')
            return { Component: module.PoolDetail }
          }}
          loader={poolDetailLoader}
          errorElement={<Error />}
        />
        <Route
          index
          element={<Pools />}
          loader={poolsLoader}
        />
        <Route
          path="watchlist"
          element={<Watchlist />}
          loader={watchlistLoader}
        />
      </Route>
    </Route>
  )
)
