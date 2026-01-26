/**
 * Utility: Multi-criteria filtering for liquidity pools.
 * 
 * Architecture: Client-side filtering (API doesn't support server-side queries).
 * All criteria are AND-based: pool must pass all active filters to appear in results.
 * 
 * Performance: O(n) where n = pool count (~8k). Runs in <5ms on modern devices,
 * acceptable for client-side UX (users expect instant feedback on filter changes).
 * 
 * @param {Object[]} pools - Raw pool array from TheGraph
 * @param {Object} filters - Active filter state from UI
 * @param {string} [filters.search=""] - Case-insensitive substring match on pool name
 * @param {string[]} [filters.platforms=[]] - Array of DEX protocol IDs (e.g. ["uniswap-v3", "curve"])
 * @param {number|string} [filters.tvlUsd] - Minimum TVL threshold (USD)
 * @param {number|string} [filters.volumeUsd1d] - Minimum 24h volume threshold (USD)
 * @returns {Object[]} Filtered subset of pools (mantains original order)
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
export function filterPools(pools, filters) {
   if (!pools || !Array.isArray(pools)) return []

   return pools.filter(pool => {
      // 1. Text Search: Case-insensitive substring match on pool name
      if (filters.search 
         && !pool.name.toLowerCase().includes(filters.search.toLocaleLowerCase())) return false

      // 2. Platform Filter: Check if pool's DEX is in selected platforms array
      // Note: .includes() is O(n) but n is small (typically 1-3 selected platforms)
      if (filters.platforms.length > 0 && !filters.platforms.includes(pool.project)) return false

      // 3. Financial Thresholds: Explicit Number() casting prevents string comparison,
      // Bug Example: Without casting, "50" > "1000" evaluates to true (lexicographic order)
      if (filters.tvlUsd && pool.tvlUsd < Number(filters.tvlUsd)) return false
      if (filters.volumeUsd1d && pool.volumeUsd1d < Number(filters.volumeUsd1d)) return false
      
      return true
   })
}
