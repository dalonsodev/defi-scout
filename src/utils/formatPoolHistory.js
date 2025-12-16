/**
 * Transforms raw PoolDayData from The Graph into chart-ready format
 * @param {Array} rawHistory - Array of poolDayData objects from API
 * @returns {Array} Formatted history with parsed numbers and readable dates
 */

function formatDateShort(timestamp) {
   const date = new Date(timestamp * 1000)
   const month = date.toLocaleDateString("en-US", { month: "short" })
   const day = date.getDate()

   return `${month} ${day}`
}

export function formatPoolHistory(rawHistory) {
   if (!rawHistory || rawHistory.length === 0) {
      return []
   }
   return rawHistory.map(day => {
      const date = new Date(day.date * 1000)
      const dateString = date.toISOString().split("T")[0]
      const tvlUSD = parseFloat(day.tvlUSD)
      const feesUSD = parseFloat(day.feesUSD)
      const apy = (feesUSD * 365 / tvlUSD) * 100

      return {
         date: dateString, // "2024-01-01"
         dateTimestamp: day.date, // Keep original for sorting if needed
         dateShort: formatDateShort(day.date),
         volumeUSD: parseFloat(day.volumeUSD) || 0,
         tvlUSD,
         feesUSD,
         token0Price: parseFloat(day.token0Price) || 0,
         token1Price: parseFloat(day.token1Price) || 0,
         apy
      }
   })
}