/**
 * Utility: Parses raw floats from TheGraph into formatted strings for display.
 *
 * @param {number|string} value - Raw price value (float or TheGraph BigDecimal string)
 * @returns {string} - Value formatted ready to display in price inputs
 */
export function formatPriceInput(value) {
  const parsedValue = parseFloat(value)

  if (!Number.isFinite(parsedValue)) return '0'

  if (parsedValue < 0.0001) return parsedValue.toFixed(12) // exotic tokens (e.g. PEPE/WETH)
  if (parsedValue < 0.01) return parsedValue.toFixed(10) // sub-cent range (e.g. WETH/USDC)
  if (parsedValue < 1) return parsedValue.toFixed(6)
  if (parsedValue < 1000) return parsedValue.toFixed(4)

  return parsedValue.toFixed(2)
}

/**
 * Utility: Generates a dynamic "step" value for inputs.
 * Helps enhance UX while the user sets value prices for their desired range.
 *
 * Design Decision: Due to the variety of possible token combinations (scales)
 * to represent values, a fixed step would not adapt well-enough to every scenario.
 *
 * Approach: Based on the magnitude of the parsed value, the step
 * will adapt to provide a meaningful visual cue of the increment/decrement
 * on-screen (charts), following a 1:1000 ratio.
 *
 * Math: Step is always 3 orders of magnitude below the value's order of magnitude
 * (step/value ≈ 10^-3 ratio), computed as 10^(floor(log10(value)) - 3).
 *
 * @param {number|string} value - Raw price value (float or TheGraph BigDecimal string)
 * @returns {number} - Step value, ready to use in input elements
 */
export function getPriceStep(value) {
  const parsedValue = parseFloat(value)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 1e-8 // safe minimum

  const magnitude = Math.floor(Math.log10(parsedValue))
  const step = Math.pow(10, magnitude - 3)

  return step
}
