/**
 * Transforms raw PoolDayData from The Graph into chart-ready format
 * @param {Array} rawHistory - Array of poolDayData objects from API
 * @returns {Array} Formatted history with parsed numbers and readable dates
 */

export function formatPoolHistory(rawHistory) {
   if (!rawHistory || rawHistory.length === 0) {
      return []
   }
   return rawHistory.map(day => {
      const date = new Date(day.date * 1000)
      const dateString = date.toISOString().split("T")[0]

      return {
         date: dateString, // "2024-01-01"
         dateTimestamp: day.date, // Keep original for sorting if needed
         volumeUSD: parseFloat(day.volumeUSD) || 0,
         tvlUSD: parseFloat(day.tvlUSD) || 0,
         feesUSD: parseFloat(day.feesUSD) || 0,
         token0Price: parseFloat(day.token0Price) || 0,
         token1Price: parseFloat(day.token1Price) || 0,
         // Derived field: inverse price for toggle feature (Day 5-6)
         token0PriceInverse: day.token1Price ? 1 / parseFloat(day.token1Price) : 0
      }
   })
}