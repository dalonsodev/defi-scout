import { validateHourSnapshot } from '../utils/validateHourSnapshot'
import { debugLog } from '../../../../utils/logger'

/**
 * Pipeline Stage: Accumulates fees from hourly snapshots proportional to user liquidity.
 * Adjusts data quality rating based on anomaly detection.
 *
 * Algorithm:
 * 1. Filter valid hours (validateHourSnapshot)
 * 2. Check if price in range (effectiveMin ≤ price ≤ effectiveMax)
 * 3. Calculate fee share: L_user / L_pool (both in RAW units)
 * 4. Accumulate proportional fees
 * 5. Downgrade quality if anomaly rate > 20%
 *
 * Technical Notes:
 * - L_user and L_pool both in RAW units (no decimal conversion needed)
 * - L_pool stored as BigInt string by TheGraph to preserve precision
 * - Fee share calculation: userFees = poolFees × (L_user / L_pool)
 * - Model limitation: Assumes constant token amounts (degrades accuracy for >50% price moves)
 *
 * @param {Object} params
 * @param {Object[]} params.hourlyData - TheGraph poolHourData snapshots (30d history)
 * @param {number} params.effectiveMin - Lower price bound (normalized to token0Price)
 * @param {number} params.effectiveMax - Upper price bound (normalized to token0Price)
 * @param {number} params.L_user - User liquidity in RAW units (from calculateLiquidity)
 * @param {string} params.initialQuality - Initial quality from assessDataQuality
 * @param {boolean} [params.debug=true] - Enable diagnostic logging
 *
 * @returns {Object} Success state (with totalFeesUSD) or failure state (with error)
 * @returns {boolean} returns.success - false if position never entered range
 * @returns {string} [returns.error] - Human-readable error message
 * @returns {number} [returns.totalFeesUSD] - Accumulated fees across in-range hours
 * @returns {number} [returns.hoursInRange] - Count of hours position was active
 * @returns {number} [returns.percentInRange] - Percentage of hours in range
 * @returns {string} returns.finalQuality - Adjusted quality (downgraded if high anomaly rate)
 * @returns {string[]} returns.warnings - Anomaly warnings (max 5)
 */
export function calculateFeesWithQuality({
  hourlyData,
  effectiveMin,
  effectiveMax,
  L_user,
  initialQuality,
  debug = true
}) {
  const warnings = []
  let totalFeesUSD = 0
  let hoursInRange = 0
  let hoursSkipped = 0

  if (debug) {
    debugLog('Fee Calculation Setup:', {
      totalHours: hourlyData.length,
      L_user: L_user.toExponential(2),
      priceRange: `${effectiveMin.toFixed(6)} - ${effectiveMax.toFixed(6)}`
    })
  }

  for (let i = 0; i < hourlyData.length; i++) {
    const hour = hourlyData[i]

    if (!validateHourSnapshot(hour)) {
      hoursSkipped++
      continue
    }

    const hourPrice = parseFloat(hour.token0Price)
    const hourFeesUSD = parseFloat(hour.feesUSD)
    const priceInRange = hourPrice >= effectiveMin && hourPrice <= effectiveMax

    if (!priceInRange) continue

    // Parse pool liquidity (BigInt string from TheGraph)
    let L_pool_bigint
    try {
      L_pool_bigint = BigInt(hour.liquidity)
    } catch {
      hoursSkipped++
      continue
    }

    if (L_pool_bigint <= 0n) continue

    const L_pool = Number(L_pool_bigint)
    const feeShare = L_user / L_pool

    // Log first fee calculation for verification
    if (hoursInRange === 0 && debug) {
      debugLog('Fee Share Calculation:', {
        feeShare: `${(feeShare * 100).toFixed(6)}%`,
        hourFeesUSD: hourFeesUSD.toFixed(2),
        userFeesThisHour: (hourFeesUSD * feeShare).toFixed(4)
      })
    }

    totalFeesUSD += hourFeesUSD * feeShare
    hoursInRange++
  }

  // Early exit: Position never entered range
  if (hoursInRange === 0) {
    const actualPriceRange = {
      min: Math.min(...hourlyData.map((h) => parseFloat(h.token0Price))),
      max: Math.max(...hourlyData.map((h) => parseFloat(h.token0Price)))
    }

    return {
      success: false,
      error: `Price never entered range (${effectiveMin.toFixed(6)}-${effectiveMax.toFixed(6)}). Actual: ${actualPriceRange.min.toFixed(6)}-${actualPriceRange.max.toFixed(6)}.`,
      dataQuality: initialQuality
    }
  }

  const percentInRange = (hoursInRange / hourlyData.length) * 100
  const anomalyRate = hoursSkipped / hourlyData.length

  // Downgrade quality based on anomaly thresholds
  let finalQuality = initialQuality
  const ANOMALY_CRITICAL = 0.5 // >50% bad data
  const ANOMALY_WARNING = 0.2 // >20% bad data

  if (anomalyRate > ANOMALY_CRITICAL) {
    finalQuality = 'INSUFFICIENT'
  } else if (anomalyRate > ANOMALY_WARNING) {
    finalQuality =
      initialQuality === 'EXCELLENT'
        ? 'RELIABLE'
        : initialQuality === 'RELIABLE'
          ? 'INSUFFICIENT'
          : initialQuality
  }

  if (finalQuality !== initialQuality) {
    warnings.unshift(
      `⚠️ Quality downgraded to ${finalQuality} (${hoursSkipped} anomalies)`
    )
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
