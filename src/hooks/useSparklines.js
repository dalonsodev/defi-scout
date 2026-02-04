import { useRef, useState, useEffect } from 'react'

/**
 * Custom Hook: Lazy-Loading Sparkline Fetcher with Local Caching
 *
 * Architecture: Coordinates with useRequestQueue to fetch historical APY data
 * for pools currently in viewport. Implements differential updates (only fetches
 * missing data) and enforces freemium paywall logic (first 10 pages free).
 *
 * @param {Object} params
 * @param {Set<string>} params.visiblePoolIds - Pool IDs in viewport (Intersection Observer)
 * @param {Function} params.queueRequest - Method to push fetch tasks into the throttler
 * @param {Function} params.cancelPendingRequests - Cleanup for navigation/unmount
 * @param {number} params.currentPage - Page index used for paywall enforcement
 *
 * @returns {Object} result
 * @returns {{ sparklineData: Object }} A dictionary of pool IDs and their las 7-day APY arrays
 *
 * @example
 * const { sparklineData } = useSparklines({
 *    visiblePoolIds: new Set(["0xabc...", "0xdef..."]),
 *    queueRequest,
 *    cancelPendingRequests,
 *    currentPage: 2
 * })
 * // sparklineData = { "0xabc...": [5.2, 5.4, 5.1, ...], ... }
 */
export function useSparklines({
  visiblePoolIds,
  queueRequest,
  cancelPendingRequests,
  currentPage
}) {
  // Local Cache: Prevents re-fetching data for the same pool during the session life-cycle
  const cache = useRef({})

  // Dummy state to force re-render when the cache reference updates
  const [_, setSparklineData] = useState({})

  useEffect(() => {
    if (!visiblePoolIds || visiblePoolIds.size === 0) return

    // Freemium model: Historical data access limited to pages 1-10
    if (currentPage > 10) return

    const poolIds = Array.from(visiblePoolIds)
    const missingIds = poolIds.filter((id) => !cache.current[id])

    // Differential Update: Only request uncached data
    if (missingIds.length === 0) return

    missingIds.forEach(async (poolId) => {
      try {
        const data = await queueRequest({
          id: poolId,
          priority: 1, // HIgh priority as these are currently visible
          fetchFn: async () => {
            try {
              const res = await fetch(`https://yields.llama.fi/chart/${poolId}`)

              if (!res.ok) {
                // Standardize error format for circuit breaker detection
                throw { status: res.status, isHttpError: true }
              }

              return res.json()
            } catch (err) {
              // Network-level rate limit: "Failed to fetch" often signals CORS/local throttling
              if (
                err instanceof TypeError &&
                err.message?.includes('Failed to fetch')
              ) {
                throw { status: 429, isHttpError: true }
              }
              throw err
            }
          }
        })

        // Extract last 7 days of base APY (excludes reward APY for cleaner trends)
        const last7 = data.data.slice(-7).map((snapshot) => snapshot.apyBase)
        cache.current[poolId] = last7

        setSparklineData({ ...cache.current })
      } catch (err) {
        // Silently handle expected network interruption (user scrolled away, rate limited)
        if (err.isCancellation) return
        if (err.status === 429) return
        console.warn(`Sparkline fetch failed for ${poolId}: `, err)
      }
    })

    // Cleanup: Cancell all pending requests if the user scrolls away or changes page
    return () => cancelPendingRequests()
  }, [visiblePoolIds, queueRequest, cancelPendingRequests, currentPage])

  return { sparklineData: cache.current }
}
