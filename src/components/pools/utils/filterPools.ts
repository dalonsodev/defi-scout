import { FormattedPool, ParamsState } from "../../../types"

type ActiveFilters = Pick<ParamsState, 'search' | 'platforms' | 'tvlUsd' | 'volumeUsd1d'>

/**
 * Utility: Normalizes pool names for comparison against filters search
 *
 * @param str - Any pool or search string to normalize
 * @returns Whitespace-free, uppercased, token-order-independent string (e.g. "WETH / USDC" -> "USDC/WETH")
 */
function normalizeSearch(str: string): string {
  return str.replace(/\s+/g, '').toUpperCase().split('/').sort().join('/')
}

/**
 * Utility: Multi-criteria filtering for liquidity pools.
 *
 * Architecture: Client-side filtering (API doesn't support server-side queries).
 * All criteria are AND-based: pool must pass all active filters to appear in results.
 *
 * Performance: O(n) where n = pool count (~8k). Runs in <5ms on modern devices,
 * acceptable for client-side UX (users expect instant feedback on filter changes).
 *
 * @param pools - Formatted pool array
 * @param filters - Active filter state from UI
 * @param filters.search="" - Order-insensitive, case-insensitive substring match on pool name
 * @param filters.platforms=[] - Array of DEX protocol IDs (e.g. ["uniswap-v3", "curve"])
 * @param filters.tvlUsd - Minimum TVL threshold (USD)
 * @param filters.volumeUsd1d - Minimum 24h volume threshold (USD)
 * @returns Filtered subset of pools (maintains original order)
 *
 * @example
 * // Filter for Uniswap V3 ETH pools with $1M+ TVL
 * filterPools(pools, {
 *    search: "ETH",
 *    platforms: ["uniswap-v3"],
 *    tvlUsd: 1000000,
 *    volumeUsd1d: ""
 * })
 * // => [{ name: "ETH/USDC", tvlUsd: 1500000, ... }, ...]
 */

export function filterPools(pools: FormattedPool[], filters: ActiveFilters): FormattedPool[] {
  if (!Array.isArray(pools)) return []

  return pools.filter((pool) => {
    // 1. Text Search: Case-insensitive substring match on pool name
    if (
      filters.search &&
      !normalizeSearch(pool.name).includes(normalizeSearch(filters.search))
    ) {
      return false
    }

    // 2. Platform Filter: Check if pool's DEX is in selected platforms array
    // Note: .includes() is O(n) but n is small (typically 1-3 selected platforms)
    if (filters.platforms.length > 0 && !filters.platforms.includes(pool.project)) {
      return false
    }

    // 3. Financial Thresholds: Explicit Number() casting prevents string comparison,
    // Bug Example: Without casting, "50" > "1000" evaluates to true (lexicographic order)
    if (filters.tvlUsd && pool.tvlUsd < Number(filters.tvlUsd)) {
      return false
    }
    if (filters.volumeUsd1d && pool.volumeUsd1d < Number(filters.volumeUsd1d)) {
      return false
    }

    return true
  })
}
