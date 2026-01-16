import { priceToTick, getTickSpacing, alignTickToSpacing } from "./uniswapV3Ticks"

/**
 * Calculates token ratio based on assumed price inside a range
 * @param {number} assumedPrice - Base price to calculate from
 * @param {number} minPrice - Lower bound of the range
 * @param {number} maxPrice - Upper bound of the range
 * @param {number} feeTier - Fee tier (100, 500, 3000 or 10000) 
 * @returns {{ token0Percent: number, token1Percent: number }}
 */
export function calculateTokenRatio(
   assumedPrice,
   minPrice,
   maxPrice,
   feeTier
) {
   // 1. validate inputs (edge cases)
   if (assumedPrice <= minPrice) {
      return { token0Percent: 100, token1Percent: 0 }
   }
   if (assumedPrice >= maxPrice) {
      return { token0Percent: 0, token1Percent: 100 }
   }
   if (minPrice === maxPrice) {
      return { token0Percent: 50, token1Percent: 50 }
   }

   // 2. convert prices to ticks
   const tickCurrent = priceToTick(assumedPrice)
   const tickLower = priceToTick(minPrice)
   const tickUpper = priceToTick(maxPrice)

   // 3. align ticks to spacing
   const tickSpacing = getTickSpacing(feeTier)

   const alignedCurrent = alignTickToSpacing(tickCurrent, tickSpacing)
   const alignedLower = alignTickToSpacing(tickLower, tickSpacing)
   const alignedUpper = alignTickToSpacing(tickUpper, tickSpacing)

   // 4. calculate ratio [0, 1]
   const ratio = (alignedCurrent - alignedUpper) / (alignedLower - alignedUpper)

   // 5. convert to percentages with simple rounding
   const token0Percent = Math.round(ratio * 100 * 100) / 100
   const token1Percent = Math.round((1 - ratio) * 100 * 100) / 100

   return { token0Percent, token1Percent }
}
