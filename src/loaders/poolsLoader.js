import { fetchPools } from '../services/theGraphClient'
import { formatPoolData } from './utils/formatPoolData'

/**
 * View Layer Data Loader: Pools Discovery Page.
 * Acts as the centralized entry point for data fetching before component mounts.
 * Orchestrates raw data retrieval from GraphQL subgraphs and triggers normalization.
 * @returns {Promise<{ pools: Object[] }>} A promise resolving to an array of UI-ready pool objects
 */
async function fetchUniswapPools() {
  try {
    // Configuration: High "first" value to minimize pagination jumps,
    // sorted by TVL as it's the most reliable indicator of pool health.
    const rawPools = await fetchPools({
      first: 1000,
      skip: 0,
      orderBy: 'totalValueLockedUSD',
      orderDirection: 'desc',
      minTVL: '0',
      minVol: '0'
    })

    // Post-proocessing: Converts BigInt strings from GraphQL into JS numbers and schema
    return formatPoolData(rawPools)
  } catch (err) {
    // Defensive Logic: Logs the error for debugging but returns an empty array,
    // to prevent the entire UI from crashing on network failures.
    console.error('The Graph error:', err)
    return []
  }
}

/**
 * React Router Loader: Executed before the route renders.
 * NOTE: This is a blocking call. Ensure the fetch time is optimized,
 * or consider deferred data for large datasets.
 */
export async function poolsLoader() {
  const pools = await fetchUniswapPools()
  return { pools }
}
