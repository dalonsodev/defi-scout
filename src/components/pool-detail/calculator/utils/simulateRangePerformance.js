import { assessDataQuality } from "./assessDataQuality"
import { calculateLiquidity } from "./calculateLiquidity"
import { validateInputs } from "../pipeline/validateInputs"
import { calculateComposition } from "../pipeline/calculateComposition"
import { calculateFeesWithQuality } from "../pipeline/calcululateFeesWithQuality"
import { inferTokenPricesFromTVL } from "../../../../utils/inferTokenPricesFromTVL"

/**
 * Orchestrator: Simulates historical LP position performance using hourly on-chain data.
 *
 * Architecture: Multi-stage pipeline (validation → composition → fee loop → metrics)
 * to prevent cascading errors. Each stage can fail independently with contextual errors.
 *
 * Model Simplifications (Trade-off: Speed vs Accuracy):
 * 1. Assumes constant token amounts → Reality: AMM rebalances on swaps
 * 2. Infers USD prices from current pool TVL → Reality: Historical prices would be better
 * 3. Uses linear interpolation for fee share → Reality: Tick-level precision exists
 *
 * Accuracy: Good for ±20% price moves over 7-30 days. Degrades for >50% moves or <7 days.
 *
 * @param {Object} params - Simulation configuration
 * @param {number} params.capitalUSD - Initial investment in USD (min $10)
 * @param {number} params.minPrice - Lower price bound (in selected token scale)
 * @param {number} params.maxPrice - Upper price bound (in selected token scale)
 * @param {boolean} params.fullRange - If true, simulates V2 position (50/50 split)
 * @param {number} params.assumedPrice - Entry price for concentrated positions
 * @param {number} params.selectedTokenIdx - 0 or 1, defines price scale interpretation
 * @param {Object[]} params.hourlyData - TheGraph poolHourData snapshots (min 168 hours)
 * @param {Object} params.pool - Pool metadata (TVL, decimals, feeTier)
 *
 * @returns {Object} Simulation result
 * @returns {boolean} returns.success - Operation status
 * @returns {string} [returns.error] - Human-readable error message (if failed)
 * @returns {number} [returns.APR] - Annualized fee return (if successful)
 * @returns {string} returns.dataQuality - "EXCELLENT" | "RELIABLE" | "LIMITED" | "INSUFFICIENT"
 * @returns {string[]} returns.warnings - Array of data anomalies detected
 *
 * @example
 * // Simulate $10k ETH/USDC position (0.3% fee, $2500-$3500 range)
 * const result = simulateRangePerformance({
 *    capitalUSD: 10000,
 *    minPrice: 2500,
 *    maxPrice: 3500,
 *    fullRange: false,
 *    assumedPrice: 3000,
 *    selectedTokenIdx: 1, // Price in USDC per ETH
 *    hourlyData: [...], // 168+ hours of poolHourData
 *    pool: { feeTier: 3000, ... }
 * })
 * // => { success: true, APR: 45.2, IL_percent: -3.1, netPnL: 412.50, ... }
 */
export function simulateRangePerformance({
   capitalUSD,
   minPrice,
   maxPrice,
   fullRange,
   assumedPrice,
   selectedTokenIdx,
   hourlyData,
   pool
}) {
   // ===== STAGE 1: BASIC VALIDATIONS =====

   const validation = validateInputs({
      capitalUSD,
      minPrice,
      maxPrice,
      fullRange,
      assumedPrice,
      selectedTokenIdx,
      hourlyData
   })

   if (!validation.success) {
      return validation
   }


   // ===== STAGE 2: DATA QUALITY ASSESSMENT =====

   const { quality, warnings: rawWarnings } = assessDataQuality(hourlyData)
   const warnings = Array.isArray(rawWarnings) ? rawWarnings : []


   // ===== STAGE 3: BLOCKING DECISION =====

   // Quality gate: Insufficient data prevents unreliable projections
   if (quality === "INSUFFICIENT") {
      return {
         success: false,
         error: "Pool needs 7+ days of data",
         quality
      }
   }


   // ===== STAGE 4: PRICE INFERENCE =====

   // Validate pool metadata (required for liquidity normalization)
   if (!pool?.totalValueLockedToken0 || !pool?.totalValueLockedToken1) {
      return {
         success: false,
         error: "Pool metadata incomplete. Cannot calculate liquidity.",
         dataQuality: quality
      }
   }

   if (!pool?.token0?.decimals || !pool?.token1?.decimals) {
      return {
         success: false,
         error: "Token decimals missing. Cannot normalize liquidity.",
         dataQuality: quality
      }
   }

   // Get current price from first hourly snapshot (TheGraph returns descending order)
   const currentPrice = parseFloat(hourlyData[0].token0Price)

   const priceInferenceResult = inferTokenPricesFromTVL({
      tvlUSD: parseFloat(pool.totalValueLockedUSD),
      tvlToken0: parseFloat(pool.totalValueLockedToken0),
      tvlToken1: parseFloat(pool.totalValueLockedToken1),
      currentPrice
   })

   if (!priceInferenceResult.success) {
      return {
         success: false,
         error: priceInferenceResult.error,
         dataQuality: quality
      }
   }

   const { priceToken0InUSD, priceToken1InUSD } = priceInferenceResult


   // ===== STAGE 5: COMPOSITION CALCULATION =====

   const allPrices = hourlyData.map(h => parseFloat(h.token0Price))
   const compositionResult = calculateComposition({
      userInputs: {
         capitalUSD,
         minPrice,
         maxPrice,
         fullRange,
         assumedPrice,
         selectedTokenIdx
      },
      poolState: {
         currentPrice,
         priceToken0InUSD,
         priceToken1InUSD,
         feeTier: pool.feeTier
      },
      historicalPrices: allPrices
   })

   if (!compositionResult.success) {
      return {
         success: false,
         error: compositionResult.error,
         dataQuality: quality
      }
   }

   const { composition, capitalAllocation, effectiveRange } = compositionResult
   const { token0Percent, token1Percent, amount0, amount1 } = composition
   const { capital0USD, capital1USD } = capitalAllocation
   const { min: effectiveMin, max: effectiveMax } = effectiveRange

   // Calculate user liquidity (Uniswap V3 formula: L = √(xy))
   const L_user = calculateLiquidity(
      amount0,
      amount1,
      currentPrice,
      effectiveMin,
      effectiveMax
   )

   // Validation: Zero liquidity means price is outside range (edge case)
   if (L_user <= 0) {
      return {
         success: false,
         error: "Position has no active liquidity at current price. Price may be outside your range.",
         dataQuality: quality
      }
   }

   /*
   * Liquidity Normalization for Decimal Differences
   *
   * Problem: On-chain liquidity uses raw units (e.g. 1e18 for USDC, 1e6 for USDT).
   * Solution: Apply geometric mean of decimals as scaling factor.
   *
   * Why average? Because L = √(amount0 * amount1), so:
   * L_raw = √((amount0 * 10^d0) * (amount1 * 10^d1))
   * L_raw = √(amount0 * amount1) * 10^((d0+d1)/2)
   *           ↑ human-readable        ↑ scaling exponent
   *
   * Example: ETH (18 decimals) / USDC (6 decimals) → exponent = 12 (from 10^12)
   */
   const decimals0 = parseInt(pool.token0.decimals)
   const decimals1 = parseInt(pool.token1.decimals)
   const liquidityExponent = (decimals0 + decimals1) / 2


   // ===== STAGE 6: FEE ACCUMULATION LOOP =====

   const feeResult = calculateFeesWithQuality({
      hourlyData,
      effectiveMin,
      effectiveMax,
      L_user,
      liquidityExponent,
      initialQuality: quality,
      debug: false
   })

   if (!feeResult.success) {
      return {
         success: false,
         error: feeResult.error,
         dataQuality: quality
      }
   }

   const {
      totalFeesUSD,
      hoursInRange,
      percentInRange,
      finalQuality,
      warnings: feeWarnings
   } = feeResult

   const allWarnings = [...warnings, feeWarnings]


   // ===== STAGE 7: METRIC AGGREGATION =====

   // Calculate time period (TheGraph poolHourData = 1 snapshot per hour)
   const daysOfData = hourlyData.length / 24

   // Calculate APR (annualized fee return)
   const feeReturnPercent = (totalFeesUSD / capitalUSD) * 100
   const APR = feeReturnPercent * (365 / daysOfData)

   return {
      success: true,

      // Fee metrics (historical baseline for projections)
      totalFeesUSD,
      feeReturnPercent,
      APR,
      dailyFeesUSD: totalFeesUSD / daysOfData,
      daysOfData,

      // Range metrics
      hoursInRange,
      percentInRange,

      // Position composition
      composition: {
         token0Percent,
         token1Percent,
         capital0USD,
         capital1USD,
         amount0,
         amount1
      },

      // Meta
      dataQuality: finalQuality,
      warnings: allWarnings.slice(0, 5)
   }
}
