/**
 * amount0
 * amount1
 * price
 * minPrice
 * maxPrice
 * 
 */

/**
 * Calculates Uniswap V3 liquidity (L) for a position
 * @param {number} amount0 - Token0 amount in position
 * @param {number} amount1 - Token1 amount in position
 * @param {number} price - Current price (token1/token0)
 * @param {number} minPrice - Lower bound of the range
 * @param {number} maxPrice - Upper bound of the range
 * @returns {number} L_user - Liquidity value
 */
export function calculateLiquidity(amount0, amount1, price, minPrice, maxPrice) {
   // Edge case 1 - Price outside range
   if (price <= minPrice || price >= maxPrice) {
      return 0
   }
   // Step 1: Calculate sqrt values
   const sqrtPrice = Math.sqrt(price)
   const sqrtMinPrice = Math.sqrt(minPrice)
   const sqrtMaxPrice = Math.sqrt(maxPrice)

   // Step 2: Calculate L0 (from token0)
   const L0 = amount0 * (sqrtPrice * sqrtMaxPrice) / (sqrtMaxPrice - sqrtPrice)

   // Step 3: Calculate L1 (from token1)
   const L1 = amount1 * (sqrtPrice * sqrtMinPrice)
   
   // Step 4: Return conservative value
   return Math.min(L0, L1)
}