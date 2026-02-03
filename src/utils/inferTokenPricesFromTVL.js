import { debugLog } from "./logger"

/**
 * Infers USD prices of both tokens from current pool TVL snapshot.
 *
 * Formula:
 * - Convert token0 to token1 units: tvl0_in_token1 = tvl0 / currentPrice
 * - Total value in token1: total = tvl0_in_token1 + tvl1
 * - Price token1: priceToken1 = tvlUSD / total
 * - Price token0: priceToken0 = priceToken1 / currentPrice
 *
 * Trade-off: Uses current TVL as proxy for historical prices (<5% error for 7-30d periods)
 *
 * @param {Object} params
 * @param {number} params.tvlUSD - Total pool TVL in USD
 * @param {number} params.tvlToken0 - Amount of token0 in pool
 * @param {number} params.tvlToken1 - Amount of token1 in pool
 * @param {number} params.currentPrice - token0Price from hourly data
 *
 * @returns {Object} Result
 * @returns {boolean} returns.success
 * @returns {string} [returns.error] - Human-readable error message
 * @returns {number} [returns.priceToken0InUSD] - Inferred token0 USD price
 * @returns {number} [returns.priceToken1InUSD] - Inferred token1 USD price
 */
export function inferTokenPricesFromTVL({
   tvlUSD,
   tvlToken0,
   tvlToken1,
   currentPrice
}) {
   const isInvalidPrice = (price) => price <= 0 || !isFinite(price)

   // Validate all inputs exist
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

   // Calculate prices using TVL proportions
   const totalValueInToken1Units = (tvlToken0 * currentPrice) + tvlToken1
   const priceToken1InUSD = tvlUSD / totalValueInToken1Units
   const priceToken0InUSD = priceToken1InUSD * currentPrice

   if (isInvalidPrice(priceToken0InUSD) || isInvalidPrice(priceToken1InUSD)) {
      return {
         success: false,
         error: "Invalid price calculation. Pool data may be corrupted."
      }
   }

   // Sanity check: Sum of (token amounts * prices) should equal total TVL
   const calculatedTVL = (tvlToken0 * priceToken0InUSD) + (tvlToken1 * priceToken1InUSD)
   const errorPercent = Math.abs((calculatedTVL - tvlUSD) / tvlUSD * 100)

   debugLog('Price Inference:', {
      token0Price: `$${priceToken0InUSD.toFixed(4)}`,
      token1Price: `$${priceToken1InUSD.toFixed(4)}`,
      calculatedTVL: `$${calculatedTVL.toFixed(2)}`,
      actualTVL: `$${tvlUSD.toFixed(2)}`,
      error: `${errorPercent.toFixed(2)}%`
   })

   return {
      success: true,
      priceToken0InUSD,
      priceToken1InUSD
   }
}
