import { calculateTokenRatio } from "../utils/calculateTokenRatio"
import { debugLog } from "../../../../utils/logger"

/**
 * Pipeline Stage: Calculates token composition and effective price range for LP position.
 * 
 * Supports two modes:
 * - Full Range: 50/50 split with volatility-based buffer (V2-style)
 * - Concentrated: Custom ratio based on user-defined price bounds (V3-style)
 * 
 * @param {Object} params
 * @param {Object} params.userInputs - User-controlled parameters
 * @param {number} params.userInputs.capitalUSD - Investment amount
 * @param {number} params.userInputs.minPrice - Lower bound (in selectedTokenIdx scale)
 * @param {number} params.userInputs.maxPrice - Upper bound (in selectedTokenIdx scale)
 * @param {boolean} params.userInputs.fullRange - Mode selector
 * @param {number} params.userInputs.assumedPrice - Entry price for concentrated mode
 * @param {number} params.userInputs.selectedTokenIdx - Price scale (0 or 1)
 * 
 * @param {Object} params.poolState - On-chain pool state
 * @param {number} params.poolState.currentPrice - token0Price from hourlyData[0]
 * @param {number} params.poolState.priceToken0InUSD - USD price of token0
 * @param {number} params.poolState.priceToken1InUSD - USD price of token1
 * @param {number} params.poolState.feeTier - Pool fee tier (500/3000/10000)
 * 
 * @param {number[]} params.historicalPrices - Array of token0Price values for volatility calc
 * 
 * @returns {Object} Result
 * @returns {boolean} returns.success
 * @returns {string} [returns.error]
 * @returns {Object} [returns.composition] - Token split
 * @returns {number} returns.composition.token0Percent
 * @returns {number} returns.composition.token1Percent
 * @returns {number} returns.composition.amount0
 * @returns {number} returns.composition.amount1
 * @returns {Object} [returns.capitalAllocation] - USD breakdown
 * @returns {number} returns.capitalAllocation.capital0USD
 * @returns {number} returns.capitalAllocation.capital1USD
 * @returns {Object} [returns.effectiveRange] - Active price bounds
 * @returns {number} returns.effectiveRange.min
 * @returns {number} returns.effectiveRange.max
 */
export function calculateComposition({
   userInputs,
   poolState,
   historicalPrices
}) {
   const {
      capitalUSD,
      minPrice,
      maxPrice,
      fullRange,
      assumedPrice,
      selectedTokenIdx
   } = userInputs

   const {
      currentPrice,
      priceToken0InUSD,
      priceToken1InUSD,
      feeTier
   } = poolState

   // ===== VALIDATIONS =====
   // TODO: Añadir validaciones básicas (capitalUSD > 0, prices > 0, etc.)
   if (!feeTier) {
      return {
         success: false,
         error: "No fee tier available. Pool data may be corrupted."
      }
   }
   
      if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
         return {
            success: false,
            error: "You must select a token."
         }
      }

   if (capitalUSD <= 0 || minPrice <= 0 || maxPrice <= 0 || assumedPrice <= 0) {
      return {
         success: false,
         error: "Values must be positive."
      }
   }

   if (currentPrice <= 0 || priceToken0InUSD <= 0 || priceToken1InUSD <= 0) {
      return {
         success: false,
         error: "Prices must be positive."
      }
   }

   if (fullRange) {
      // ===== FULL RANGE MODE =====
      const token0Percent = 50
      const token1Percent = 50
      const capital0USD = capitalUSD / 2
      const capital1USD = capitalUSD / 2
      const amount0 = capital0USD / priceToken0InUSD
      const amount1 = capital1USD / priceToken1InUSD

      // Calculate dynamic buffer based on volatility
      const historicalMin = Math.min(...historicalPrices)
      const historicalMax = Math.max(...historicalPrices)
      const volatility = (historicalMax - historicalMin) / historicalMin

      const bufferMultiplier = volatility < 0.2 ? 0.3 :
                               volatility < 0.5 ? 0.5 :
                               1.0

      const effectiveMin = historicalMin * (1 - bufferMultiplier)
      const effectiveMax = historicalMax * (1 + bufferMultiplier)

      return {
         success: true,
         composition: {
            token0Percent,
            token1Percent,
            amount0,
            amount1
         },
         capitalAllocation: {
            capital0USD,
            capital1USD,
         },
         effectiveRange: {
            min: effectiveMin,
            max: effectiveMax
         }
      }
   } else {
      // ===== CONCENTRATED MODE =====
      const minNum = Number(minPrice)
      const maxNum = Number(maxPrice)
      const assumedNum = Number(assumedPrice)

      // Step 1: Normalize user inputs to token0Price scale
      // Context: UI shows prices in selected token's perspective (e.g. "USDC per ETH"),
      // but calculations always use token0Price (protocol standard).
      let normalizedMinPrice = minNum
      let normalizedMaxPrice = maxNum
      let normalizedAssumedPrice = assumedNum

      if (selectedTokenIdx === 1) {
         // User inputs are in token1Price scale (inverted)
         // Example: "3107 USDT per WETH" → "0.000322 WETH per USDT"
         normalizedMinPrice = 1 / maxNum
         normalizedMaxPrice = 1 / minNum
         normalizedAssumedPrice = 1 / assumedNum
      }

      // Step 2: Calculate token ratio using tick-based formula (see calculateTokenRatio.js)
      const ratioResult = calculateTokenRatio(
         normalizedAssumedPrice,
         normalizedMinPrice,
         normalizedMaxPrice,
         feeTier
      )

      const token0Percent = ratioResult.token0Percent
      const token1Percent = ratioResult.token1Percent
      
      // Step 3: Split capital according to ratio
      const capital0USD = capitalUSD * (token0Percent / 100)
      const capital1USD = capitalUSD * (token1Percent / 100)
      
      // Step 4: Convert USD capital to token amounts
      const amount0 = capital0USD / priceToken0InUSD
      const amount1 = capital1USD / priceToken1InUSD

      // Step 5: Set effective range (no buffer needed for user-defined bounds)
      const effectiveMin = normalizedMinPrice
      const effectiveMax = normalizedMaxPrice

      // 🔍 DIAGNOSTIC (helps debug composition issues in production)
      debugLog('🔍 Composition:', {
         mode: fullRange ? 'FULL_RANGE' : 'CONCENTRATED',
         token0Percent,
         token1Percent,
         capital0USD: capital0USD.toFixed(2),
         capital1USD: capital1USD.toFixed(2)
      })
      debugLog('🔍 Effective Range:', { 
         effectiveMin: effectiveMin.toFixed(8), 
         effectiveMax: effectiveMax.toFixed(8) 
      })

      return {
         success: true,
         composition: {
            token0Percent,
            token1Percent,
            amount0,
            amount1
         },
         capitalAllocation: {
            capital0USD,
            capital1USD,
         },
         effectiveRange: {
            min: effectiveMin,
            max: effectiveMax
         }
      }
   }
}
