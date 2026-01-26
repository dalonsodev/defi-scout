/**
 * Utility: Uniswap V3 Liquidity Calculator (L) for Active Positions
 * 
 * Architecture: Computes the "virtual liquidity" parameter L that determines:
 * 1. How much of each token is locked in the position
 * 2. The position's share of trading fees (proportional to L / L_global)
 * 
 * Design Decision: Returns Math.min(L0, L1) (the "binding constraint").
 * Rationale: In V3, a position can be limited by EITHER token's availability.
 * If user deposits 100 USDC but only 0.01 ETH, the effective liquidity is capped
 * by the ETH amount. This prevents overestimating fee earnings.
 * 
 * Reference: Uniswap V3 whitepaper, Section 6.2.1
 * https://uniswap.org/whitepaper-v3.pdf
 */

/**
 * Calculates Uniswap V3 liquidity (L) for a position
 * @param {number} amount0 - Token0 quantity deposited (e.g. 1000 USDC)
 * @param {number} amount1 - Token1 quantity deposited (e.g. 0.5 ETH)
 * @param {number} price - Current market price (token1/token0, e.g. 2000 USDC/ETH)
 * @param {number} minPrice - Lower bound of the range (Pa)
 * @param {number} maxPrice - Upper bound of the range (Pb)
 * @returns {number} L_user - Effective liquidity (0 if position is out of range)
 * 
 * @example
 * // User deposits $10k in 2000 USDC/ETH pool with ±10% range
 * const L = calculateLiquidity(5000, 2.5, 2000, 1800, 2200)
 * // Returns ~7071 (lower of the two token constraints)
 */
export function calculateLiquidity(amount0, amount1, price, minPrice, maxPrice) {
   // Edge Case: Position out of range → no fees earned, return 0
   // This prevents division by zero in downstream calculations (fee APR would be Infinity)
   if (price <= minPrice || price >= maxPrice) {
      return 0
   }

   // ===== STEP 1: SQRT TRANSFORMATIONS =====
   // V3 math operates in "sqrt price space" for gas efficiency
   const sqrtPrice = Math.sqrt(price)
   const sqrtMinPrice = Math.sqrt(minPrice)
   const sqrtMaxPrice = Math.sqrt(maxPrice)

   // ===== STEP 2: CALCULATE L0 (TOKEN0 CONSTRAINT) =====
   // Formula: L = Δx × (√P × √Pb) / (√Pb - √P)
   // Represents: "How much liquidity can token0 provide?"
   const L0 = amount0 * (sqrtPrice * sqrtMaxPrice) / (sqrtMaxPrice - sqrtPrice)
   
   // ===== STEP 3: CALCULATE L1 (TOKEN1 CONSTRAINT) =====
   // Formula: L = Δy / (√P - √Pa)
   // Represents: "How much liquidity can token1 provide?"
   const L1 = amount1 * (sqrtPrice * sqrtMinPrice)
   
   // ===== STEP 4: RETURN BINDING CONSTRAINT =====
   // Min ensures we don't overestimate position power when one token runs out
   return Math.min(L0, L1)
}
