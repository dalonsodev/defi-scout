import { formatPriceInput } from '../../../../utils/priceInputUtils'

interface InputsToInvert {
  minPrice: string
  maxPrice: string
  fullRange: boolean
  assumedPrice: number
}

interface RangeResult {
  minPrice: string
  maxPrice: string
  assumedPrice: string
}

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
 * @param inputs
 * @param inputs.minPrice - Lower price bound (in selected token scale)
 * @param inputs.maxPrice - Upper price bound (in selected token scale)
 * @param inputs.fullRange - If true, returns null (range not needed)
 * @param inputs.assumedPrice - Entry price for concentrated positions
 *
 * @returns Range prices (minPrice, maxPrice, assumedPrice)
 *
 * @example
 * invertPriceRange({ minPrice: "1500", maxPrice: "2000", ... })
 * // => { minPrice: "0.00050000", maxPrice: "0.00066667", ... }
 */
export function invertPriceRange(inputs: InputsToInvert): RangeResult | null {
  const { minPrice, maxPrice, fullRange, assumedPrice } = inputs

  if (fullRange) return null
  if (minPrice === '' || maxPrice === '' || !isFinite(assumedPrice)) return null

  const oldMin = Number(minPrice)
  const oldMax = Number(maxPrice)
  const oldAssumed = Number(assumedPrice)

  if (!Number.isFinite(oldMin) || !Number.isFinite(oldMax) || !Number.isFinite(oldAssumed))
    return null
  if (oldMin <= 0 || oldMax <= 0 || oldAssumed <= 0) return null

  const newMin = 1 / oldMax
  const newMax = 1 / oldMin
  const newAssumed = 1 / oldAssumed

  return {
    minPrice: formatPriceInput(newMin.toString()),
    maxPrice: formatPriceInput(newMax.toString()),
    assumedPrice: formatPriceInput(newAssumed.toString())
  }
}
