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
 * @param {number} daysLookback - Amount of days to get data
 * @returns {{
 *    hourlyData: PoolHourDatas[],
 *    isLoading: boolean,
 *    fetchError: string|null
 * }}
 */
export function usePoolHourlyData(poolId, daysLookback = 7) {
  const [hourlyData, setHourlyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  /**
   * Data Fetching: 7-Day Hourly Lookback.
   * Retrieves 168 data points for fee growth simulation.
   *
   * Why 7 days? Balance between:
   * - Sample size (statistical significance)
   * - Recency (captures current market conditions)
   * Trade-off: Longer windows (30d) smooth outliers but miss regime changes.
   */
  useEffect(() => {
    setIsLoading(true)
    setFetchError(null)

    let cancelled = false

    async function loadHourlyData() {
      try {
        const startTime =
          Math.floor(Date.now() / 1000) - daysLookback * 24 * 60 * 60
        const rawData = await fetchPoolHourData(poolId, startTime)
        const data = formatHourlyData(rawData)

        if (!cancelled) {
          setHourlyData(data)
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
