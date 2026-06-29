import { fetchPoolHistory } from '../services/theGraphClient'
import { formatPoolHistory } from './utils/formatPoolHistory'
import { LoaderFunctionArgs } from 'react-router-dom'
import type { FormattedPoolHistory, RawPoolHistory } from '../types'

interface LoaderResultSuccess {
  pool: RawPoolHistory,
  history: FormattedPoolHistory[],
  ethPriceUSD: number
}

interface LoaderResultFailure {
  poolId: string
  history: [],
  error: string
}

type PoolDetailLoaderResult = LoaderResultSuccess | LoaderResultFailure

/**
 * Loader: Pool Detail Page Data Fetcher
 *
 * Architecture Decision: Uses blocking await (no defer) because all UI components
 * depend on historical data. Unlike poolsLoader which can show skeleton UI while
 * loading 8k pools, this page has no meaningful content without the 30-day chart data.
 *
 * Trade-off: Slower initial paint (~500ms) vs cleaner component logic (no Suspense handling).
 *
 * @param context - React router loader context
 * @param context.params - URL parameters
 * @param context.params.poolId - Pool contract address (checksummed or lowercase)
 *
 * @returns Loader data
 * @returns returns.pool - Pool metadata (tokens, fees, current TVL)
 * @returns returns.history - 30-day formatted snapshots with calculated APY
 * @returns [returns.error] - Human-readable error message for UI display
 *
 * @throws 500 error if GraphQL query fails (network/API key issues)
 */

export async function poolDetailLoader({ params }: LoaderFunctionArgs): Promise<PoolDetailLoaderResult> {
  const { poolId } = params

  if (!poolId) throw new Response('Pool ID missing', { status: 400 })

  // TheGraph uses Unix timestamps in seconds (not milliseconds like Date.now())
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400 // In seconds, not ms

  try {
    const { pool, history, ethPriceUSD } = await fetchPoolHistory(
      poolId,
      thirtyDaysAgo
    )

    // Edge Case: Pool exists but has no daily snapshots (new pool, or indexing lag)
    if (!history || history.length === 0) {
      return {
        poolId,
        history: [],
        error: 'No historical data found for this pool'
      }
    }

    return {
      pool,
      history: formatPoolHistory(history),
      ethPriceUSD
    }
  } catch (error) {
    console.error('Pool detail loader error:', error)

    // React Router error boundary: Renders ErrorBoundary component instead of detail page
    throw new Response('Failed to load pool data', { status: 500 })
  }
}

export type { PoolDetailLoaderResult }
