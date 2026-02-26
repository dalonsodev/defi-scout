import { useRef, useState, useEffect } from 'react'
import {
  fetchPoolSparklines,
  formatSparklineData
} from '../services/theGraphClient'

/**
 * Custom Hook: Lazy-Loading Sparkline Fetcher with Session Cache
 *
 * Architecture: Fetches 14-day APY trend data from TheGraph for pools currently
 * in viewport. Single batch GraphQL query replaces 40+ sequential REST calls.
 * Implements differential updates (only fetches uncached pools) and freemium
 * enforcement (page 1 only).
 *
 * Data Flow:
 * visiblePools (Set<Object>)
 *  -> differential filter (skip cached)
 *    -> fetchPoolSparklines (single TheGraph batch query)
 *      -> formatSparklineData (poolDayDatas -> APY arrays)
 *        -> cache.current (session-persistent)
 *
 * @param {Object} params
 * @param {Set<Object>} params.visiblePools - Set of full pool objects in viewport
 * @param {number} params.currentPage - Freemium gate: only page 1 fetches data
 *
 * @returns {{ sparklineData: Object }} Dictionary: poolId -> 14-day APY array
 *
 * @example
 * const { sparklineData } = useSparklines({
 *   visiblePools: new Set([{ id: "0xabc...", symbol: "USDC/WETH" }]),
 *   currentPage: 1
 * })
 * // sparklineData = { "0xabc...": [3.1, 3.4, 2.9, ...] }
 */
export function useSparklines({ visiblePools, currentPage }) {
  // Local Cache: Prevents re-fetching data for the same pool during the session life-cycle
  const cache = useRef({})

  // Dummy state to force re-render when the cache reference updates
  const [_, setSparklineData] = useState({})

  useEffect(() => {
    // Freemium Gate: Pages 2+ handled by SparklineCell (shows "Upgrade to Pro" tooltip)
    if (currentPage > 1) return

    if (!visiblePools || visiblePools.size === 0) return

    // Prevents setState after component unmounts during async fetch
    let isMounted = true

    const fetchData = async () => {
      try {
        // Differential Update: Only request pools missing from session cache
        const missingAddresses = Array.from(visiblePools)
          .map((pool) => pool.id)
          .filter((id) => id && !cache.current[id])

        if (missingAddresses.length === 0) return

        const grouped = await fetchPoolSparklines(missingAddresses)

        if (!isMounted) return

        // Transform poolDayDatas -> APY arrays and persist in cache
        Object.entries(grouped).forEach(([poolId, poolDayDatas]) => {
          cache.current[poolId] = formatSparklineData(poolDayDatas)
        })

        setSparklineData({ ...cache.current })
      } catch (err) {
        if (!isMounted) return
        console.warn('Sparkline fetch failed:', err)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }

  }, [visiblePools, currentPage])

  return { sparklineData: cache.current }
}
