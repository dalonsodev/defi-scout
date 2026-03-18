/**
 * Utility: Parses raw floats from TheGraph into formatted strings for display.
 *
 * @param {number|string} value - Raw price value (float or TheGraph BigDecimal string)
 * @returns {string} - Value formatted ready to display in price inputs
 */
export function formatPriceInput(value) {
  const parsedValue = parseFloat(value)

  if (!Number.isFinite(parsedValue)) return "0"

  if (parsedValue < 0.0001) return parsedValue.toFixed(12) // exotic tokens (e.g. PEPE/WETH)
  if (parsedValue < 0.01) return parsedValue.toFixed(10)   // sub-cent range (e.g. WETH/USDC)
  if (parsedValue < 1) return parsedValue.toFixed(6)
  if (parsedValue < 1000) return parsedValue.toFixed(4)

  return parsedValue.toFixed(2)
}
