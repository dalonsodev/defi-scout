/**
 * Transforms raw poolHourDatas from The Graph into calculation-ready format
 * @param {Array} rawData - Array of poolHourDatas objects from API
 * @returns {Object} { hourlyData, stats }
 */
export function formatPoolHourData(rawData) {
  if (!rawData || rawData.length === 0) {
    return { hourlyData: [], stats: null }
  }

  const hourlyData = rawData.map((hour) => ({
    timestamp: hour.periodStartUnix,
    date: new Date(hour.periodStartUnix * 1000), // for display
    token0Price: parseFloat(hour.token0Price),
    token1Price: parseFloat(hour.token1Price),
    feesUSD: parseFloat(hour.feesUSD),
    liquidity: parseFloat(hour.liquidity),
    tvlUSD: parseFloat(hour.tvlUSD),
    sqrtPrice: hour.sqrtPrice, // Keep as string (Q64.96 format, rarely needed)
    tick: parseInt(hour.tick),
  }))

  const stats = {
    dataPoints: hourlyData.length,
    daysOfData: Math.floor(hourlyData.length / 24),
    startDate: hourlyData[0].date,
    endDate: hourlyData[hourlyData.length - 1].date,
    minPrice: Math.min(...hourlyData.map((h) => h.token0Price)),
    maxPrice: Math.max(...hourlyData.map((h) => h.token1Price)),
    medianPrice: calculateMedian(hourlyData.map((h) => h.token0Price)),
    totalFeesUSD: hourlyData.reduce((acc, curr) => acc + curr.feesUSD, 0),
  }

  return { hourlyData, stats }
}

function calculateMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}
