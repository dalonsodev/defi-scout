/**
 * Utility: Transforms raw PoolDayData from The Graph into chart-ready format.
 * @param {Array} rawHistory - Array of poolDayData objects from API
 * @returns {Array} Formatted history with parsed numbers and readable dates
 */

function formatDateShort(timestamp) {
  const date = new Date(timestamp * 1000)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()

  return `${month} ${day}`
}

export function formatPoolHistory(rawHistory) {
  if (!rawHistory || rawHistory.length === 0) {
    return []
  }
  return rawHistory.map((day) => {
    // Normalization: Extract ISO date for consistent data key mapping
    const date = new Date(day.date * 1000)
    const dateString = date.toISOString().split('T')[0]

    const tvlUSD = parseFloat(day.tvlUSD)
    const feesUSD = parseFloat(day.feesUSD)

    /**
     * Daily APY Extrapolation:
     * Logic: (daily fees / current TVL) * 365 days
     * NOTE: This represents a 24h performance snapshot projected annually,
     * which may show high volatility compared to the pool's lifetime average.
     */
    const apy = ((feesUSD * 365) / tvlUSD) * 100

    return {
      date: dateString, /// Standard ISO format for filtering (e.g. "2024-01-01")
      dateTimestamp: day.date,
      dateShort: formatDateShort(day.date),
      volumeUSD: parseFloat(day.volumeUSD) || 0,
      tvlUSD,
      feesUSD,
      token0Price: parseFloat(day.token0Price) || 0,
      token1Price: parseFloat(day.token1Price) || 0,
      apy: isFinite(apy) ? apy : 0, // Safety: Prevent infinity values if TVL = 0
    }
  })
}
