/**
 * Utility: Infers USD prices of both tokens using current TVL snapshot.
 * 
 * Formula: priceToken1 = totalUSD / (tvl0/currentPrice + tvl1)
 *          priceToken0 = priceToken1 / currentPrice
 * 
 * Trade-offs: Uses current TVL as proxy for historical prices.
 * Acceptable error: <5% for 7-30 day periods.
 * 
 * @param {Object} params
 * @param {number} params.tvlUSD - Total pool TVL in USD
 * @param {number} prarms.tvlToken0 - Amount of token0 in pool
 * @param {number} prarms.tvlToken1 - Amount of token1 in pool
 * @param {number} params.currentPrice - token0Price from hourlyData
 * 
 * @returns {Object} Result
 * @returns {boolean} result.success
 * @returns {string} [results.error]
 * @returns {number} [results.priceToken0InUSD]
 * @returns {number} [results.priceToken1InUSD]
 */
export function inferTokenPricesFromTVL({
   tvlUSD,
   tvlToken0,
   tvlToken1,
   currentPrice
}) {
   const isInvalidPrice = (price) => price <= 0 || !isFinite(price)

   if (tvlUSD == null || tvlToken0 == null || 
      tvlToken1 == null || currentPrice == null) {
      
      return {
         success: false,
         error: "Pool metadata incomplete. Cannot calculate prices."
      }
   }

   if (isInvalidPrice(currentPrice) || isNaN(currentPrice)) {
      return {
         success: false,
         error: "Invalid current price from hourly data."
      }
   }

   if (isInvalidPrice(tvlUSD)) {
      return {
         success: false,
         error: "Pool has no liquidity (TVL = $0)."
      }
   }

   if (isInvalidPrice(tvlToken0) || isInvalidPrice(tvlToken1)) {
      return {
         success: false,
         error: "Pool is imbalanced (one token at 0%). Cannot calculate prices."
      }
   }

   const priceToken1InUSD = tvlUSD / (tvlToken0 * currentPrice + tvlToken1)
   const priceToken0InUSD = priceToken1InUSD * currentPrice

   if (isInvalidPrice(priceToken0InUSD) || isInvalidPrice(priceToken1InUSD)) {
         return {
            success: false,
            error: "Invalid price calculation. Pool data may be corrupted."
         }
      }

   return {
      success: true,
      priceToken0InUSD,
      priceToken1InUSD
   }
}
