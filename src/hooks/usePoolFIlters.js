import { useCallback, useState } from 'react'

/**
 * Custom Hook: Centralized Filter State Manager
 *
 * Architecture: Single source of truth for all pool discovery filters instead of
 * prop drilling through PoolsContent → PoolFilters → individual inputs. Uses memoized
 * handlers to prevent child component re-renders when parent state changes.
 *
 * Design Decision: Separate togglePlatform() instead of generic updateFilter()
 * because multi-select dropdowns need array manipulation (add/remove), while other
 * filters are simple value replacements. This keeps child components clean.
 *
 * Performance: useCallback with empty deps ensures stable references for input
 * onChange handlers. Without this, PoolFilters would re-render on every keystroke
 * in search input (unnecessary diffing of 40+ table rows below).
 * @returns {{
 *    filters: Object,
 *    updateFilter: Function,
 *    togglePlatform: Function,
 *    clearFilters: Function
 * }}
 * @property {Object} filters - Current filter values
 * @property {string} filters.search - Pool name/token search query (case-insensitive match)
 * @property {string[]} filters.platforms - Selected platform IDs (e.g. ["uniswap-v3", "curve-dex"])
 * @property {string} filters.tvlUsd - Minimum TVL threshold (stored as string for input compatibility)
 * @property {string} filters.volumeUsd1d - Minimum 24h volume threshold
 * @property {string} filters.riskLevel - Risk filter ("low" | "medium" | "high" | "")
 * @property {Function} updateFilter - Generic setter: (key: string, value: string) => void
 * @property {Function} togglePlatform - Multi-select handler: (platformId: string) => void
 * @property {Function} clearFilters - Reset to factory defaults: () => void
 *
 * @example
 * // Typical usage in PoolsContent orchestrator
 * function PoolsContent({ pools }) {
 *   const { filters, updateFilter, togglePlatform, clearFilters } = usePoolFilters()
 *
 *   // Extract unique platforms from API data
 *   const availablePlatforms = useMemo(() =>
 *     extractUniquePlatforms(pools), [pools]
 *   )
 *
 *   // Apply filter pipeline before pagination
 *   const filteredPools = useMemo(() =>
 *     filterPools(pools, filters), [pools, filters]
 *   )
 *
 *   return (
 *     <>
 *       <PoolFilters
 *         filters={filters}
 *         updateFilter={updateFilter}
 *         togglePlatform={togglePlatform}
 *         clearFilters={clearFilters}
 *         availablePlatforms={availablePlatforms}
 *       />
 *       <PoolTable pools={filteredPools} />
 *     </>
 *   )
 * }
 */
export function usePoolFilters() {
  const [filters, setFilters] = useState({
    search: '',
    platforms: [],
    tvlUsd: '',
    volumeUsd1d: '',
    riskLevel: '',
  })

  // Stable reference for input handlers (prevents PoolFilters re-renders)
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Immutable toggle: creates a new array instead of mutating existing
  const togglePlatform = useCallback((platform) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform) // Remove if present
        : [...prev.platforms, platform], // Add if absent
    }))
  }, [])

  // Reset to initial state (matches useState defaults above)
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      platforms: [],
      tvlUsd: '',
      volumeUsd1d: '',
      riskLevel: '',
    })
  }, [])

  return {
    filters,
    updateFilter,
    togglePlatform,
    clearFilters,
  }
}
