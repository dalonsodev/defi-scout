import { useState, useEffect } from 'react'
import { formatHourlyData } from '../../../../loaders/utils/formatHourlyData'
import { fetchPoolHourData } from '../../../../services/theGraphClient'

/**
 * @typedef {Object} PoolHourDatas
 * @property {number} periodStartUnix - Timestamp of period start (Unix seconds)
 * @property {string} token0Price - Current token0 price (parsed float)
 * @property {string} token1Price - Current token1 price (parsed float)
 * @property {string} feesUSD - Accumulated fees is USD
 * @property {string} liquidity - Total liquidity (precision loss acceptable)
 * @property {string} tvlUSD - Total value locked in USD
 * @property {string} dateShort - Tooltip label (e.g. "Feb 10 - 14:00")
 * @property {string} dayLabel - Axis label: day number or month name at boundaries
 */

/**
 * Custom Hook: Fetch and cache TheGraph data.
 *
 * @param {string|number} poolId - Pool's unique identifier
 * @param {number} daysLookback - Pipeline window in days (hook fetches daysLookback + 1
 *                                days internally to guard against boundary drift and
 *                                sparse gaps, then trims to daysLookback * 24 points)
 * @returns {{
 *    hourlyData: PoolHourDatas[],
 *    isLoading: boolean,
 *    fetchError: string|null
 * }}
 */
export function usePoolHourlyData(poolId, daysLookback = 30) {
  const [hourlyData, setHourlyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  /**
   * Data Fetching: daysLookback Hourly Lookback.
   * Fetches (daysLookback + 1) days of data points for fee growth simulation.
   *
   * Why daysLookback + 1? Balance between:
   * - Sample size (statistical significance)
   * - Recency (captures current market conditions)
   * - Allows for an extra buffer to exceed full hour boundaries (TheGraph)
   * Trade-off: Longer windows (30d) smooth outliers but miss regime changes.
   *
   * Note: The data get sliced to (daysLookback * 24) points to avoid
   * inflated APR calculation.
   */
  useEffect(() => {
    setIsLoading(true)
    setFetchError(null)

    let cancelled = false

    async function loadHourlyData() {
      try {
        // Extra buffer to circumvent full hour boundaries from TheGraph,
        // and possible sparse gaps in the pool data due to low activity.
        const fetchDays = daysLookback + 1
        const startTime =
          Math.floor(Date.now() / 1000) - fetchDays * 24 * 60 * 60
        const rawData = await fetchPoolHourData(poolId, startTime)
        const data = formatHourlyData(rawData)
        // slice the last daysLookback days to avoid inflated APR calculation
        const result = data.slice(-(daysLookback * 24))

        if (!cancelled) {
          setHourlyData(result)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('❌ Fetch error:', err)
        if (!cancelled) {
          setFetchError(err.message)
          setIsLoading(false)
        }
      }
    }

    loadHourlyData()
    return () => {
      cancelled = true
    } // Cleanup: Prevents state update on unmounted component
  }, [poolId, daysLookback])

  return { hourlyData, isLoading, fetchError }
}
