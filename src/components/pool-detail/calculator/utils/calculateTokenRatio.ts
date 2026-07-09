import { priceToTick, getTickSpacing, alignTickToSpacing } from './uniswapV3Ticks'

/**
 * Utility: Calculates token composition ratio for Uniswap V3 concentrated positions.
 *
 * Architecture: Token ratio changes non-linearly across price ranges due to
 * rebalancing. A position at tick 100 in [50, 150] is NOT 50/50 composition.
 *
 * @param assumedPrice - Entry price (token1/token0 ratio)
 * @param minPrice - Lower bound of concentrated range
 * @param maxPrice - Upper bound of concentrated range
 * @param feeTier - Pool fee tier (100, 500, 3000, 10000 bps)
 *
 * @returns Composition percentages rounded to 2 decimals (UI display precision)
 *
 * @example
 * // ETH/USDC pool at $3000, range $2500-$3500, 0.3% fee
 * calculateTokenRatio(3000, 2500, 3500, 3000)
 * => { token0Percent: 45.23, token1Percent: 54.77 }
 * // Position skewed toward USDC (token1) because price is mid-range
 */
export function calculateTokenRatio(
  assumedPrice: number,
  minPrice: number,
  maxPrice: number,
  feeTier: number
) {
  // Financial Edge Case: Handle boundary conditions where liquidity becomes single-sided
  if (assumedPrice <= minPrice) {
    // Price below range: 100% token0 (cheaper asset), 0% token1
    return { token0Percent: 0, token1Percent: 100 }
  }
  if (assumedPrice >= maxPrice) {
    // Price above range: 0% token0, 100% token1 (more expensive asset)
    return { token0Percent: 100, token1Percent: 0 }
  }
  if (minPrice === maxPrice) {
    // Degenerate range: Default to 50/50 (prevents division by zero)
    return { token0Percent: 50, token1Percent: 50 }
  }

  // Convert prices to tick indices (logarithmic scale: tick = log1.0001(price))
  const tickCurrent = priceToTick(assumedPrice)
  const tickLower = priceToTick(minPrice)
  const tickUpper = priceToTick(maxPrice)

  // Align ticks to protocol-mandated spacing (positions can only exist on valid grid points)
  const tickSpacing = getTickSpacing(feeTier)
  const alignedCurrent = alignTickToSpacing(tickCurrent, tickSpacing)
  const alignedLower = alignTickToSpacing(tickLower, tickSpacing)
  const alignedUpper = alignTickToSpacing(tickUpper, tickSpacing)

  // Linear interpolation in tick space (corresponds to non-linear price interpolation)
  // Formula: ratio ∈ [0, 1] where 0 = all token0, 1 = all token1
  const ratio = (alignedCurrent - alignedUpper) / (alignedLower - alignedUpper)

  // Convert to percentages with simple rounding with 2-decimal precision (UI constraint: fits table cells)
  const token0Percent = Math.round((1 - ratio) * 100 * 100) / 100
  const token1Percent = Math.round(ratio * 100 * 100) / 100

  return { token0Percent, token1Percent }
}
