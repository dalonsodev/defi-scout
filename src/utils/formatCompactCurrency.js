/**
 * Format currency in compact notation for charts (e.g. $1.2M, $340K)
 * @param {number} value - Raw currency value
 * @returns {string} Formatted compact string
 */

export function formatCompactCurrency(value) {
   if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
   if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
   if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
   return `$${value.toFixed(0)}`
}