import { useState, useEffect } from 'react'
import { formatHourlyData } from '../../../../loaders/utils/formatHourlyData'
import { fetchPoolHourData } from '../../../../services/theGraphClient'
import type { FormattedHourlyData, RawPoolHourData } from '../../../../types'

interface PoolHourlyDataResult {
    hourlyData: FormattedHourlyData[] | null
    rawHourlyData: RawPoolHourData[] | null
    isLoading: boolean
    fetchError: string | null
 }

/**
 * Custom Hook: Fetch and cache TheGraph data.
 *
 * @param poolId - Pool's unique identifier
 * @param daysLookback - Pipeline window in days (hook fetches daysLookback + 1
 *                          days internally to guard against boundary drift and
 *                          sparse gaps, then trims to daysLookback * 24 points)
 */
export function usePoolHourlyData(poolId: string, daysLookback: number = 30): PoolHourlyDataResult {
  const [hourlyData, setHourlyData] = useState<FormattedHourlyData[] | null>(null)
  const [rawHourlyData, setRawHourlyData] = useState<RawPoolHourData[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
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
        // slice the last daysLookback days to avoid inflated APR calculation
        const rawSliced = rawData.slice(-(daysLookback * 24))

        if (!cancelled) {
          setRawHourlyData(rawSliced)
          setHourlyData(formatHourlyData(rawSliced))
          setIsLoading(false)
        }
      } catch (err) {
        console.error('❌ Fetch error:', err)
        if (!cancelled) {
          if (err instanceof Error) {
            setFetchError(err.message)
          } else {
            setFetchError('Unknown error occurred')
          }
          setIsLoading(false)
        }
      }
    }

    loadHourlyData()
    return () => {
      cancelled = true
    } // Cleanup: Prevents state update on unmounted component
  }, [poolId, daysLookback])

  return { hourlyData, rawHourlyData, isLoading, fetchError }
}
