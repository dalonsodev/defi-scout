import { fetchPoolHistory } from "../services/theGraphClient"
import { formatPoolHistory } from "./utils/formatPoolHistory"

/**
 * Loader for pool detail page
 * Fetches 30 days of historical data for a specific pool
 * 
 * @param {Object} context - React router loader context
 * @param {Object} context.params - URL params
 * @param {string} context.params.poolId - Pool contract address
 * @returns {Promise<Object>} { poolId, history }
 */

export async function poolDetailLoader({ params }) {
   const { poolId } = params
   const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 86400) // In seconds, not ms

   try {
      const { pool, history } = await fetchPoolHistory(poolId, thirtyDaysAgo)

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
      throw new Response("Failed to load pool data", { status: 500 })
   }
}