import { assessDataQuality } from './assessDataQuality'
import { calculateLiquidity } from './calculateLiquidity'
import { validateInputs } from '../pipeline/validateInputs'
import { calculateComposition } from '../pipeline/calculateComposition'
import { calculateFeesWithQuality } from '../pipeline/calculateFeesWithQuality'
import { inferTokenPricesFromTVL } from '../../../../utils/inferTokenPricesFromTVL'
import { debugLog } from '../../../../utils/logger'

/**
 * Orchestrates historical LP position simulation using hourly on-chain data.
 *
 * Pipeline Architecture (fail-fast stages):
 * 1. Validate inputs (capital, price range, data completeness)
 * 2. Assess data quality (EXCELLENT/RELIABLE/LIMITED/INSUFFICIENT)
 * 3. Infer token USD prices from pool TVL
 * 4. Calculate position composition (50/50 vs concentrated)
 * 5. Compute liquidity (L_user) with decimal normalization
 * 6. Accumulate fees from hourly snapshots
 * 7. Calculate APR and return metrics
 *
 * Model Trade-offs (Speed vs Accuracy):
 * - Assumes constant token amounts → Reality: AMM rebalances
 * - Infers USD prices from current TVL → Reality: use historical prices
 * - Linear interpolation for fee share → Reality: tick-level precision
 * - Accuracy: Good for ±20% moves over 7-30 days
 *
 * @param {Object} params
 * @param {number} params.capitalUSD - Initial investment (min $10)
 * @param {number} params.minPrice - Lower bound (in selected token scale)
 * @param {number} params.maxPrice - Upper bound (in selected token scale)
 * @param {boolean} params.fullRange - If true, simulates V2-style 50/50 position
 * @param {number} params.assumedPrice - Entry price for concentrated positions
 * @param {number} params.selectedTokenIdx - 0 or 1 (defines price interpretation)
 * @param {Object[]} params.hourlyData - TheGraph poolHourData (min 168 hours)
 * @param {Object} params.pool - Pool metadata (TVL, decimals, feeTier)
 *
 * @returns {Object} Simulation result
 * @returns {boolean} returns.success - Operation status
 * @returns {string} [returns.error] - Error message if failed
 * @returns {number} [returns.APR] - Annualized fee return (if successful)
 * @returns {number} [returns.totalFeesUSD] - Accumulated historical fees
 * @returns {number} [returns.dailyFeesUSD] - Average daily fees
 * @returns {Object} [returns.composition] - Position breakdown (amounts, USD values)
 * @returns {string} returns.dataQuality - EXCELLENT | RELIABLE | LIMITED | INSUFFICIENT
 * @returns {string[]} returns.warnings - Anomalies detected (max 5)
 */
export function simulateRangePerformance({
  capitalUSD,
  minPrice,
  maxPrice,
  fullRange,
  assumedPrice,
  selectedTokenIdx,
  hourlyData,
  pool,
}) {
  // ===== STAGE 1: INPUT VALIDATION =====
  const validation = validateInputs({
    capitalUSD,
    minPrice,
    maxPrice,
    fullRange,
    assumedPrice,
    selectedTokenIdx,
    hourlyData,
  })

  if (!validation.success) return validation

  // ===== STAGE 2: DATA QUALITY ASSESSMENT =====
  const { quality, warnings: rawWarnings } = assessDataQuality(hourlyData)
  const warnings = Array.isArray(rawWarnings) ? rawWarnings : []

  if (quality === 'INSUFFICIENT') {
    return {
      success: false,
      error: 'Pool needs 7+ days of data for reliable projections',
      quality,
    }
  }

  // ===== STAGE 3: METADATA VALIDATION =====
  if (!pool?.totalValueLockedToken0 || !pool?.totalValueLockedToken1) {
    return {
      success: false,
      error: 'Pool metadata incomplete. Cannot calculate liquidity.',
      dataQuality: quality,
    }
  }

  if (!pool?.token0?.decimals || !pool?.token1?.decimals) {
    return {
      success: false,
      error: 'Token decimals missing. Cannot normalize liquidity.',
      dataQuality: quality,
    }
  }

  // ===== STAGE 4: PRICE INFERENCE =====
  const currentPrice = parseFloat(hourlyData[0].token0Price)

  const priceInferenceResult = inferTokenPricesFromTVL({
    tvlUSD: parseFloat(pool.totalValueLockedUSD),
    tvlToken0: parseFloat(pool.totalValueLockedToken0),
    tvlToken1: parseFloat(pool.totalValueLockedToken1),
    currentPrice,
  })

  if (!priceInferenceResult.success) {
    return {
      success: false,
      error: priceInferenceResult.error,
      dataQuality: quality,
    }
  }

  const { priceToken0InUSD, priceToken1InUSD } = priceInferenceResult

  // ===== STAGE 5: COMPOSITION CALCULATION =====
  const allPrices = hourlyData.map((h) => parseFloat(h.token0Price))
  const compositionResult = calculateComposition({
    userInputs: {
      capitalUSD,
      minPrice,
      maxPrice,
      fullRange,
      assumedPrice,
      selectedTokenIdx,
    },
    poolState: {
      currentPrice,
      priceToken0InUSD,
      priceToken1InUSD,
      feeTier: pool.feeTier,
    },
    historicalPrices: allPrices,
  })

  if (!compositionResult.success) {
    return {
      success: false,
      error: compositionResult.error,
      dataQuality: quality,
    }
  }

  const { composition, capitalAllocation, effectiveRange } = compositionResult
  const { token0Percent, token1Percent, amount0, amount1 } = composition
  const { capital0USD, capital1USD } = capitalAllocation
  const { min: effectiveMin, max: effectiveMax } = effectiveRange

  debugLog('Position Composition:', {
    capital: `$${capitalUSD.toLocaleString()}`,
    split: `${token0Percent}% / ${token1Percent}%`,
    range: `${effectiveMin.toFixed(4)} - ${effectiveMax.toFixed(4)}`,
  })

  // ===== STAGE 6: LIQUIDITY CALCULATION =====
  const decimals0 = parseInt(pool.token0.decimals)
  const decimals1 = parseInt(pool.token1.decimals)

  // Geometric mean of decimals (L = √(amount0 × amount1) in sqrt space)
  const liquidityExponent = (decimals0 + decimals1) / 2
  let L_user_base

  if (fullRange) {
    // Full range: Simplified formula (entire 0 to ∞ curve)
    L_user_base = Math.sqrt(amount0 * amount1)
  } else {
    // Concentrated: Canonical Uniswap V3 formula
    L_user_base = calculateLiquidity(
      amount0,
      amount1,
      currentPrice,
      effectiveMin,
      effectiveMax,
    )
  }

  if (L_user_base <= 0 || !isFinite(L_user_base)) {
    return {
      success: false,
      error: 'Invalid liquidity calculation. Check range parameters.',
      dataQuality: quality,
    }
  }

  // Scale to RAW units (matches TheGraph's L_pool scale)
  const L_user = L_user_base * Math.pow(10, liquidityExponent)

  // Sanity check: Fee share should be reasonable
  const L_pool_first = parseFloat(hourlyData[0].liquidity)
  const feeSharePercent = (L_user / L_pool_first) * 100

  debugLog('Liquidity Calculated:', {
    L_user: L_user.toExponential(3),
    L_pool: L_pool_first.toExponential(3),
    feeShare: `${feeSharePercent.toFixed(6)}%`,
    expected: fullRange ? '0.0001% - 0.001%' : '0.001% - 0.1%',
  })

  if (feeSharePercent > 100) {
    debugLog('⚠️ Fee share > 100% (possible scaling bug)')
  }

  // ===== STAGE 7: FEE ACCUMULATION =====
  const feeResult = calculateFeesWithQuality({
    hourlyData,
    effectiveMin,
    effectiveMax,
    L_user,
    initialQuality: quality,
    debug: false,
  })

  if (!feeResult.success) {
    return {
      success: false,
      error: feeResult.error,
      dataQuality: quality,
    }
  }

  const {
    totalFeesUSD,
    hoursInRange,
    percentInRange,
    finalQuality,
    warnings: feeWarnings,
  } = feeResult

  const allWarnings = [...warnings, ...feeWarnings]

  // ===== STAGE 8: METRIC AGGREGATION =====
  const daysOfData = hourlyData.length / 24
  const feeReturnPercent = (totalFeesUSD / capitalUSD) * 100
  const APR = feeReturnPercent * (365 / daysOfData)

  debugLog('Final Metrics:', {
    totalFees: `$${totalFeesUSD.toFixed(2)}`,
    APR: `${APR.toFixed(2)}%`,
    inRange: `${percentInRange.toFixed(1)}%`,
  })

  return {
    success: true,
    totalFeesUSD,
    feeReturnPercent,
    APR,
    dailyFeesUSD: totalFeesUSD / daysOfData,
    daysOfData,
    hoursInRange,
    percentInRange,
    composition: {
      token0Percent,
      token1Percent,
      capital0USD,
      capital1USD,
      amount0,
      amount1,
    },
    dataQuality: finalQuality,
    warnings: allWarnings.slice(0, 5),
  }
}
