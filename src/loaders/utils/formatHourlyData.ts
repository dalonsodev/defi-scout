import type { FormattedHourlyData, RawPoolHourData } from '../../types'

/**
 * Utility: Transforms raw PoolHourData from The Graph into chart-ready format.
 *
 * @param rawHourlyData - Array of poolHourData objects from API
 * @returns Formatted hourly data with parsed numbers and readable dates
 */
export function formatHourlyData(rawHourlyData: RawPoolHourData[]): FormattedHourlyData[] {
  if (!rawHourlyData?.length) {
    return []
  }

  return rawHourlyData.map((record) => {
    const date = new Date(record.periodStartUnix * 1000)

    const month = date.toLocaleString('en-US', { month: 'short' })
    const day = date.getDate().toString()
    const hour = date.getHours().toString().padStart(2, '0')

    // Month Boundary: show "Mar" instead of "01" when day rolls over
    const dayLabel = date.getDate() === 1 ? month : day
    const dateShort = `${month} ${day} - ${hour}:00`

    return {
      dateShort,
      dayLabel,
      token0Price: parseFloat(record.token0Price) || null,
      token1Price: parseFloat(record.token1Price) || null,
      periodStartUnix: parseInt(record.periodStartUnix.toString()),
      liquidity: parseFloat(record.liquidity),
      tvlUSD: parseFloat(record.tvlUSD) || 0,
      feesUSD: parseFloat(record.feesUSD) || 0
    }
  })
}
