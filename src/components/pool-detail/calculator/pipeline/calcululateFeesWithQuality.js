import { validateHourSnapshot } from "../utils/validateHourSnapshot"
import { debugLog } from "../../../../utils/logger"

/**
 * Pipeline Stage: Accumulates fees from hourly snapshots proportional to user liquidity.
 * Also adjusts data quality rating based on anomaly detection.
 * 
 * Algorithm:
 * 1. Filter valid hours (validateHourSnapshot)
 * 2. Check if price in range
 * 3. Calculate fee share: L_user / (L_pool_normalized + L_user)
 * 4. Accumulate fees
 * 5. Adjust quality if anomaly rate > 20%
 * 
 * Domain Logic:
 * - L_user: Calculated as √(token0Amount × token1Amount). Represents geometric
 *   mean of position value.
 * - liquidityExponent: Decimal places to convert liquidity from "Wei" units
 *   (typically 18 for most ERC20 tokens).
 * 
 * Model Limitation: Assumes constant token amounts → Reality: AMM rebalances
 * Accuracy: Good for ±20% price moves, degrades for > 50% moves
 * 
 * @param {Object} params
 * @param {Object[]} params.hourlyData - TheGraph poolHourData snapshots
 * @param {number} params.effectiveMin - Lower price bound (normalized)
 * @param {number} params.effectiveMax - Upper price bound (normalized)
 * @param {number} params.L_user - User liquidity (√xy, normalized)
 * @param {number} params.liquidityExponent - Normalization factor
 * @param {string} params.initialQuality - From assesDataQuality
 * 
 * @returns {Object} Returns either success state (with totalFeesUSD) or failure state (with error)
 * @returns {boolean} returns.success - false if "never in range"
 * @returns {string} [returns.error] - Human-readable error (if failed)
 * @returns {number} [returns.totalFeesUSD] - Accumulated fees
 * @returns {number} [returns.hoursInRange] - Hours where position was active
 * @returns {number} [returns.percentInRange] - % of hours in range
 * @returns {number} returns.finalQuality - Adjusted quality rating
 * @returns {string[]} returns.warnings - Anomalies detected (max 5)
 */
export function calculateFeesWithQuality({
   hourlyData,
   effectiveMin,
   effectiveMax,
   L_user,
   liquidityExponent,
   initialQuality,
   debug = false,
}) {
   const warnings = []
   let totalFeesUSD = 0
   let hoursInRange = 0
   let hoursSkipped = 0
   
   let debugCount = 0

   for (let i = 0; i < hourlyData.length; i++) {
      const hour = hourlyData[i]

      // If invalid hour, skip it to prevent skewed calculation
      if (!validateHourSnapshot(hour)) {
         hoursSkipped++
         continue
      }
      
      const hourPrice = parseFloat(hour.token0Price)
      const hourLiquidity = parseFloat(hour.liquidity)
      const hourFeesUSD = parseFloat(hour.feesUSD)
      
      const priceInRange = hourPrice >= effectiveMin && hourPrice <= effectiveMax

      if (!priceInRange) continue
      
      // [DEBUG] Logging first 3 hours for validation
      if (debug && debugCount < 3) {
         debugLog(`🔍 Hour ${i}:`, {
            hourPrice: hourPrice.toFixed(8),
            effectiveMin: effectiveMin.toFixed(8),
            effectiveMax: effectiveMax.toFixed(8),
            priceInRange,
            hourFeesUSD,
            hourLiquidity
         })
         debugCount++
      }
      
      let L_pool_bigint

      // BigInt throws on non-numeric strings (corrupted data from TheGraph)
      try {
         L_pool_bigint = BigInt(hour.liquidity)
      } catch {
         hoursSkipped++
         continue
      }

      if (L_pool_bigint <= 0) continue

      const L_pool_normalized = Number(L_pool_bigint) / Math.pow(10, liquidityExponent)
      const feeShare = L_user / (L_pool_normalized + L_user)

      // Accumulate fees across all in-range hours (weighted by user's share of pool liquidity)
      totalFeesUSD += hourFeesUSD * feeShare
      hoursInRange++
   }

   if (hoursInRange === 0) {
      const actualPriceRange = {
         min: Math.min(...hourlyData.map(h => parseFloat(h.token0Price))),
         max: Math.max(...hourlyData.map(h => parseFloat(h.token0Price)))
      }

      return {
         success: false,
         error: `Price never entered range (${effectiveMin.toFixed(6)}-${effectiveMax.toFixed(6)}). Actual range: ${actualPriceRange.min.toFixed(6)}-${actualPriceRange.max.toFixed(6)}.`,
         dataQuality: initialQuality
      }
   }

   const percentInRange = (hoursInRange / hourlyData.length) * 100
   const anomalyRate = hoursSkipped / hourlyData.length
   
   // Downgrade quality if anomaly rate excedes thresholds (20% = "RELIABLE", 50% = "INSUFFICIENT")
   let finalQuality = initialQuality

   const ANOMALY_THRESHOLD_CRITICAL = 0.5  // > 50% bad data = unreliable projections
   const ANOMALY_THRESHOLD_WARNING = 0.2   // > 20% bad data = distorted projections

   if (anomalyRate > ANOMALY_THRESHOLD_CRITICAL) { 
      finalQuality = "INSUFFICIENT"
   } else if (anomalyRate > ANOMALY_THRESHOLD_WARNING) {
      finalQuality = initialQuality === "EXCELLENT" ? "RELIABLE" :
                     initialQuality === "RELIABLE" ? "INSUFFICIENT" :
                     initialQuality
   }

   if (finalQuality !== initialQuality) {
      warnings.unshift(`⚠️ Data quality downgraded to ${finalQuality} due to ${hoursSkipped} anomalies.`)
   }

   return {
      success: true,
      totalFeesUSD,
      hoursInRange,
      percentInRange,
      finalQuality,
      warnings
   }
}
