/**
 * Utility: Standard Impermanent Loss Calculator (Uniswap V2/V3 Baseline)
 * Computes the "divergence loss" between holding assets externally vs. providing liquidity.
 *
 * WARNING: This uses the XY=K (Constant Product) formula.
 * For Uniswap V3 concentrated positions, this represents the "Baseline IL".
 * Actual IL in V3 is multiplied by the liquidity leverage factor (1 / (1 - (Pa/Pb)^0.25)).
 *
 * Formula Reference: https://lambert-guillaume.medium.com/understanding-the-value-of-uniswap-v3-liquidity-positions-cdaaee127fe7
 *
 * @param {number} initialPrice - Starting price ratio (token1/token0)
 * @param {number} finalPrice - Ending price ratio (token1/token0)
 * @returns {number} IL as decimal (e.g. -0.057 represents a 5.7% loss relative to holding)
 *
 * @example
 * // ETH goes from $2000 to $3000 (1.5x move)
 * const il = calculateIL(2000, 3000) // -0.0605 = ~6% loss vs holding 50/50
 */
export function calculateIL(initialPrice, finalPrice) {
  // Defensive: Prevents division by zero or negative price logic
  if (initialPrice <= 0 || finalPrice <= 0) {
    throw new Error('Prices must be positive non-zero values')
  }

  // Data Normalization: Calculate the magnitude of the price move
  const priceRatio = finalPrice / initialPrice

  /**
   * Domain Logic: The Divergence Loss Formula (Uniswap V3).
   * Classic IL formula: 2 x √(ratio) / (1 + ratio) - 1
   *
   * This calculates the value of the LP position relative to the value of
   * the same assets held in a 50/50 HODL portfolio.
   *
   * Example: 2x price move → IL ≈ -5.7%
   *          10x price move → IL ≈ -25.5%
   */
  const IL_decimal = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1

  return IL_decimal
}
