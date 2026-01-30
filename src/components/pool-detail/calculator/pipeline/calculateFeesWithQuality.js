import { validateHourSnapshot } from "../utils/validateHourSnapshot"
import { debugLog } from "../../../../utils/logger"

/**
 * Pipeline Stage: Accumulates fees from hourly snapshots proportional to user liquidity.
 * Also adjusts data quality rating based on anomaly detection.
 *
 * Algorithm:
 * 1. Filter valid hours (validateHourSnapshot)
 * 2. Check if price in range
 * 3. Calculate fee share: L_user_scaled / L_pool
 * 4. Accumulate fees
 * 5. Adjust quality if anomaly rate > 20%
 *
 * Architecture Decision: L_user comes in "human units" (e.g. 0.1887 WETH),
 * but L_pool from TheGraph is in "wei units" (e.g. 5.8e14).
 * We scale L_user by 10^liquidityExponent to match scales before division.
 *
 * liquidityExponent Derivation:
 * For WETH (18 decimals) / USDC (6 decimals), L uses geometric mean: (18+6)/2 = 12
 * This represents the "sqrt space" that Uniswap V3 operates in.
 *
 * Model Limitation: Assumes constant token amounts → Reality: AMM rebalances
 * Accuracy: Good for ±20% price moves, degrades for > 50% moves
 *
 * @param {Object} params
 * @param {Object[]} params.hourlyData - TheGraph poolHourData snapshots
 * @param {number} params.effectiveMin - Lower price bound (normalized)
 * @param {number} params.effectiveMax - Upper price bound (normalized)
 * @param {number} params.L_user - User liquidity (from calculateLiquidity, in human units)
 * @param {number} params.liquidityExponent - Decimal normalization factor (avg of token0/token1 decimals)
 * @param {string} params.initialQuality - From assessDataQuality
 * @param {boolean} params.debug - Enable diagnostic logging
 *
 * @returns {Object} Returns either success state (with totalFeesUSD) or failure state (with error)
 * @returns {boolean} returns.success - false if "never in range"
 * @returns {string} [returns.error] - Human-readable error (if failed)
 * @returns {number} [returns.totalFeesUSD] - Accumulated fees
 * @returns {number} [returns.hoursInRange] - Hours where position was active
 * @returns {number} [returns.percentInRange] - % of hours in range
 * @returns {string} returns.finalQuality - Adjusted quality rating
 * @returns {string[]} returns.warnings - Anomalies detected (max 5)
 */
export function calculateFeesWithQuality({
   hourlyData,
   effectiveMin,
   effectiveMax,
   L_user,
   initialQuality,
   debug = true,
}) {
   const warnings = []
   let totalFeesUSD = 0
   let hoursInRange = 0
   let hoursSkipped = 0

   let debugCount = 0

   // L_user already in RAW units from calculateLiquidity (no scaling needed)
   // Old code: L_user_scaled = L_user × 10^12 (INCORRECT - double scaling)
   // New code: Use L_user directly since both L_user and L_pool are in RAW units
   const L_user_raw = L_user  // Renamed for clarity


   debugLog(`📊 Hourly Data Status:`, {
      totalHours: hourlyData.length,
      firstHour: hourlyData[0] || 'EMPTY ARRAY',
      L_user_scaled: L_user_raw.toExponential(2),
      effectiveMin: effectiveMin.toFixed(8),
      effectiveMax: effectiveMax.toFixed(8)
   })

   for (let i = 0; i < hourlyData.length; i++) {
      const hour = hourlyData[i]

      // If invalid hour, skip it to prevent skewed calculation
      if (!validateHourSnapshot(hour)) {
         hoursSkipped++
         continue
      }

      const hourPrice = parseFloat(hour.token0Price)
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
            hourLiquidity: hour.liquidity
         })
         debugCount++
      }

      // Parse pool liquidity (comes as string from TheGraph to preserve precision)
      let L_pool_bigint
      try {
         L_pool_bigint = BigInt(hour.liquidity)
      } catch {
         hoursSkipped++
         continue
      }

      if (L_pool_bigint <= 0n) continue

      // Convert pool liquidity to Number for division (loses precision but acceptable for fee calc)
      const L_pool = Number(L_pool_bigint)

      // CRITICAL: Log fee calculation BEFORE conditions
      if (hoursInRange === 0 && debug) {
         const feeShare = L_user / L_pool
         debugLog(`💰 Fee Calculation (Hour ${i}):`, {
            L_user_scaled: L_user.toExponential(2),
            L_pool: L_pool.toExponential(2),
            feeShare: (feeShare * 100).toFixed(6) + '%',
            hourFeesUSD: hourFeesUSD.toFixed(2),
            userFeesThisHour: (hourFeesUSD * feeShare).toFixed(4)
         })
      }

      // Calculate your share of the pool
      // Example: 6.94e10 / 5.8e14 = 0.0001196 (0.012% of pool)
      const feeShare = L_user / L_pool

      // [DEBUG] Log fee calculation for first in-range hour
      if (debug && hoursInRange === 0) {
         debugLog(`💰 Fee Calculation (First Hour):`, {
            L_user_scaled: L_user.toExponential(2),
            L_pool: L_pool.toExponential(2),
            feeShare: (feeShare * 100).toFixed(6) + '%',
            hourFeesUSD: hourFeesUSD.toFixed(2),
            userFeesThisHour: (hourFeesUSD * feeShare).toFixed(4)
         })
      }

      // Accumulate fees across all in-range hours
      totalFeesUSD += hourFeesUSD * feeShare
      hoursInRange++
   }

   // Early Exit: Position never entered range (user set unrealistic bounds)
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

   // Downgrade quality if anomaly rate exceeds thresholds
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
