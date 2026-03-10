/**
 * Utility: Transforms raw PoolHourData from The Graph into chart-ready format.
 *
 * @param {Array} rawHourlyData - Array of poolHourData objects from API
 * @returns {Array} Formatted hourly data with parsed numbers and readable dates
 */
export function formatHourlyData(rawHourlyData) {
  if (!rawHourlyData || !rawHourlyData?.length) {
    return []
  }

  return rawHourlyData.map((record) => {
    const date = new Date(record.periodStartUnix * 1000)

    const month = date.toLocaleString('en-US', { month: 'short' })
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')

    // Month Boundary: show "Mar" instead of "01" when day rolls over
    const dayLabel = date.getDate() === 1 ? month : day
    const dateShort = `${month} ${day} - ${hour}:00`

    return {
      dateShort,
      dayLabel,
      token0Price: parseFloat(record.token0Price) || null,
      token1Price: parseFloat(record.token1Price) || null,
      periodStartUnix: parseInt(record.periodStartUnix),
      liquidity: parseFloat(record.liquidity),
      tvlUSD: parseFloat(record.tvlUSD) || 0,
      feesUSD: parseFloat(record.feesUSD) || 0
    }
  })
}
