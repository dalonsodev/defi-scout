import { fetchPoolHistory } from "../services/theGraphClient"
import { formatPoolHistory } from "./utils/formatPoolHistory"

/**
 * Loader: Pool Detail Page Data Fetcher
 * 
 * Architecture Decision: Uses blocking await (no defer) because all UI components
 * depend on historical data. Unlike poolsLoader which can show skeleton UI while
 * loading 8k pools, this page has no meaningful content without the 30-day chart data.
 * 
 * Trade-off: Slower initial paint (~500ms) vs cleaner component logic (no Suspense handling).
 * 
 * @param {Object} context - React router loader context
 * @param {Object} context.params - URL parameters
 * @param {string} context.params.poolId - Pool contract address (checksummed or lowercase)
 * 
 * @returns {Promise<Object>} Loader data
 * @returns {Object} returns.pool - Pool metadata (tokens, fees, current TVL)
 * @returns {Array} returns.history - 30-day formatted snapshots with calculated APY
 * @returns {string} [returns.error] - Human-readable error message for UI display
 * 
 * @throws {Response} 500 error if GraphQL query fails (network/API key issues)
 */

export async function poolDetailLoader({ params }) {
   const { poolId } = params

   // TheGraph uses Unix timestamps in seconds (not milliseconds like Date.now())
   const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 86400) // In seconds, not ms

   try {
      const { pool, history } = await fetchPoolHistory(poolId, thirtyDaysAgo)

      // Edge Case: Pool exists but has no daily snapshots (new pool, or indexing lag)
      if (!history || history.length === 0) {
         return {
            poolId,
            history: [],
            error: "No historical data found for this pool"
         }
      }
      const formattedHistory = formatPoolHistory(history)

      return {
         pool,
         history: formattedHistory
      }

   } catch (error) {
      console.error("Pool detail loader error:", error)

      // React Router error boundary: Renders ErrorBoundary component instead of detail page
      throw new Response("Failed to load pool data", { status: 500 })
   }
}
