/**
 * Utility: Format currency in compact notation for charts (e.g. $1.2M, $340K).
 *
 * Design Decision: Converts large numeric values into shortened representations
 * optimized for chart axes and UI labels where horizontal space is constrained.
 * Precision: .toFixed(1) optimized for chart axes with limited horizontal space.
 * Trade-off: Loses precision (.toFixed(1) for K/M/B) but improves readability.
 *
 * @param {number} value - Raw currency value
 * @returns {string} Formatted compact string with currency symbol
 *
 * @example
 * formatCompactCurrency(1234567)   // "$1.2M"
 * formatCompactCurrency(890)       // "$890" (no decimals < 1K)
 */
export function formatCompactCurrency(value) {
   // Threshold: Billions (10^9)
   if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`

   // Threshold: Millions (10^6)
   if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`

   // Threshold: Thousands (10^3)
   if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`

   // Small values: No decimals (reduces visual clutter in tight UI spaces)
   return `$${value.toFixed(0)}`
}
