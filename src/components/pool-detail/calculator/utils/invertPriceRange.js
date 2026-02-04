/**
 * Utility: Inverts Uniswap V3 range prices for token base flip
 *
 * Mathematical Invariant: In Uniswap V3, price of A/B = 1 / (B/A).
 * When base token changes, we must:
 * 1. Invert all prices: P' = 1/P
 * 2. Swap min/max: (a < x < b) becomes (1/b < 1/x < 1/a)
 *
 * Skip Cases (returns null):
 * - If fullRange → return null
 * - If empty minPrice/maxPrice/assumedPrice → return null
 * - If any ≤ 0 or !isFinite() → return null
 *
 * @param {Object} inputs
 * @param {string} inputs.minPrice - Lower price bound (in selected token scale)
 * @param {string} inputs.maxPrice - Upper price bound (in selected token scale)
 * @param {boolean} inputs.fullRange - If true, returns null (range not needed)
 * @param {number} inputs.assumedPrice - Entry price for concentrated positions
 *
 * @returns {Object|null} { minPrice: string, maxPrice: string, assumedPrice: string }
 *
 * @example
 * invertPriceRange({ minPrice: "1500", maxPrice: "2000", ... })
 * // => { minPrice: "0.00050000", maxPrice: "0.00066667", ... }
 */
export function invertPriceRange(inputs) {
  const { minPrice, maxPrice, fullRange, assumedPrice } = inputs

  if (fullRange) return null
  if (minPrice === '' || maxPrice === '' || !isFinite(assumedPrice)) return null

  const oldMin = Number(minPrice)
  const oldMax = Number(maxPrice)
  const oldAssumed = Number(assumedPrice)

  if (!isFinite(oldMin) || !isFinite(oldMax) || !isFinite(oldAssumed))
    return null
  if (oldMin <= 0 || oldMax <= 0 || oldAssumed <= 0) return null

  const newMin = 1 / oldMax
  const newMax = 1 / oldMin
  const newAssumed = 1 / oldAssumed

  return {
    minPrice: newMin.toFixed(8),
    maxPrice: newMax.toFixed(8),
    assumedPrice: newAssumed.toFixed(8)
  }
}
