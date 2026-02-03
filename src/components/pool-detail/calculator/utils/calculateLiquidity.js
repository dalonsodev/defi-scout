import { debugLog } from '../../../../utils/logger'

/**
 * Calculates Uniswap V3 liquidity (L) for a concentrated position.
 *
 * Theory: L represents "virtual reserves" in the sqrt(price) space.
 * It determines fee accrual rate: higher L = more capital deployed = more fees.
 *
 * Key Insight: Uniswap uses P = token1/token0 (e.g., WETH per USDC),
 * but our data provides token0/token1 (e.g., USDC per WETH).
 * We invert prices before applying Uniswap formulas.
 *
 * Position States:
 * - Below range (P < P_low): 100% token0, use Δx formula
 * - In range (P_low ≤ P ≤ P_high): Both tokens, take min(L0, L1)
 * - Above range (P > P_high): 100% token1, use Δy formula
 *
 * @param {number} amount0 - Token0 amount (human units, e.g. 1000 USDC)
 * @param {number} amount1 - Token1 amount (human units, e.g. 0.5 WETH)
 * @param {number} price - Current price (token0/token1, e.g. 2000 USDC per WETH)
 * @param {number} minPrice - Lower bound (same scale as price)
 * @param {number} maxPrice - Upper bound (same scale as price)
 * @returns {number} Liquidity in RAW units (compatible with TheGraph's L_pool)
 */
export function calculateLiquidity(
  amount0,
  amount1,
  price,
  minPrice,
  maxPrice,
) {
  // Invert to Uniswap V3 convention (P = token1/token0)
  const P = 1 / price
  const P_low = 1 / maxPrice // Higher token0/token1 → lower token1/token0
  const P_high = 1 / minPrice

  const sqrtP = Math.sqrt(P)
  const sqrtPLow = Math.sqrt(P_low)
  const sqrtPHigh = Math.sqrt(P_high)

  debugLog('Liquidity Inputs:', {
    amount0,
    amount1,
    currentPrice: price.toFixed(4),
    range: `${minPrice.toFixed(4)} - ${maxPrice.toFixed(4)}`,
  })

  debugLog('After Price Inversion:', {
    P: P.toFixed(8),
    P_low: P_low.toFixed(8),
    P_high: P_high.toFixed(8),
    sqrtP: sqrtP.toFixed(6),
  })

  let liquidity
  let positionState

  if (P <= P_low) {
    // Below range: L = Δx × (√P_high × √P_low) / (√P_high - √P_low)
    liquidity = (amount0 * (sqrtPHigh * sqrtPLow)) / (sqrtPHigh - sqrtPLow)
    positionState = 'BELOW_RANGE (100% token0)'
  } else if (P >= P_high) {
    // Above range: L = Δy / (√P_high - √P_low)
    liquidity = amount1 / (sqrtPHigh - sqrtPLow)
    positionState = 'ABOVE_RANGE (100% token1)'
  } else {
    // In range: Calculate from both tokens, use minimum (binding constraint)
    const liq0 = (amount0 * (sqrtP * sqrtPHigh)) / (sqrtPHigh - sqrtP)
    const liq1 = amount1 / (sqrtP - sqrtPLow)

    liquidity = Math.min(liq0, liq1)
    positionState = `IN_RANGE (binding: ${liq0 < liq1 ? 'token0' : 'token1'})`

    debugLog('In-Range Calculation:', {
      liq0: liq0.toExponential(3),
      liq1: liq1.toExponential(3),
      final: liquidity.toExponential(3),
    })
  }

  debugLog('Calculated Liquidity:', {
    state: positionState,
    L_user: liquidity.toExponential(6),
  })

  return liquidity
}
