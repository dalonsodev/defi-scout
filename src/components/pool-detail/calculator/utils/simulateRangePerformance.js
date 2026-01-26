import { assessDataQuality } from "./assessDataQuality"
import { calculateTokenRatio } from "./calculateTokenRatio"
import { calculateLiquidity } from "./calculateLiquidity"
import { calculateIL } from "./calculateIL"
import { debugLog } from "../../../../utils/logger"

/**
 * Orchestrator: Simulates historical LP position performance using hourly on-chain data.
 * 
 * Architecture: Multi-stage pipeline (validation → composition → fee loop → IL → metrics)
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
 * @returns {number} [returns.IL_percent] - Impermanent loss percentage
 * @returns {number} [returns.netPnL] - Total P&L (fees - IL) in USD
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
   if (!hourlyData?.length || hourlyData.length < 168) {
      return { success: false, error: "No hourly data" }
   }

   if (capitalUSD < 10) {
      return { success: false, error: "Capital must be at least $10"}
   }
   
   if (!fullRange) {
      if (
         minPrice === "" || minPrice == null ||
         maxPrice === "" || maxPrice == null
      ) {
         return { 
            success: false, 
            error: "Price range required when Full Range is off" 
         }
      }

      const minNum = Number(minPrice)
      const maxNum = Number(maxPrice)
      
      if (!isFinite(minNum) || !isFinite(maxNum) || minNum <= 0 || maxNum <= 0) {
         return {
            success: false,
            error: "Prices must be positive"
         }
      }
      if (minNum >= maxNum) {
         return { 
            success: false, 
            error: "Min Price must be lower than Max Price" 
         }
      }
      if (assumedPrice === "" || assumedPrice == null) {
         return {
            success: false,
            error: "Assumed Entry Price required when full range is off"
         }
      }

      const assumedNum = Number(assumedPrice)
      if (!isFinite(assumedNum) || assumedNum <= 0) {
         return {
            success: false,
            error: "Assumed Entry Price must be positive"
         }
      }
   }

   if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
      return { success: false, error: "You must select a token"}
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
   
   // ===== STAGE 4: LIQUIDITY CALCULATION =====
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

   // Validation: NaN prices crash Recharts (silent fail), non-positive breaks math
   if (isNaN(currentPrice) || currentPrice <= 0) {
      return {
         success: false,
         error: "Invalid current price from hourly data",
         dataQuality: quality
      }
   }

   // Infer USD prices using TVL ratio formula
   // Limitation: Uses current TVL as proxy for historical prices (acceptable for <30d)
   const tvlUSD = parseFloat(pool.totalValueLockedUSD)
   const tvl0 = parseFloat(pool.totalValueLockedToken0)
   const tvl1 = parseFloat(pool.totalValueLockedToken1)

   const priceToken1InUSD = tvlUSD / (tvl0 / currentPrice + tvl1)
   const priceToken0InUSD = priceToken1InUSD / currentPrice

   // Edge case validations
   if (tvlUSD <= 0) {
      return {
         success: false,
         error: "Pool has no liquidity (TVL = $0)",
         dataQuality: quality
      }
   }

   if (tvl0 <= 0 || tvl1 <= 0) {
      return {
         success: false,
         error: "Pool is imbalanced (one token at 0%). Cannot calculate prices.",
         dataQuality: quality
      }
   }

   if (priceToken0InUSD <= 0 || priceToken1InUSD <= 0 || 
      !isFinite(priceToken0InUSD) || !isFinite(priceToken1InUSD)) {
         return {
            success: false,
            error: "Invalid price calculation. Pool data may be corrupted",
            dataQuality: quality
         }
   }

   // Calculate token composition + effective range
   let token0Percent, token1Percent, capital0USD, capital1USD, amount0, amount1
   let effectiveMin, effectiveMax
   
   if (fullRange) {
      // ===== FULL RANGE MODE =====
      
      // Token composition: Always 50/50 (like Uniswap V2)
      token0Percent = 50
      token1Percent = 50
      capital0USD = capitalUSD / 2
      capital1USD = capitalUSD / 2
      amount0 = capital0USD / priceToken0InUSD
      amount1 = capital1USD / priceToken1InUSD

      // Effective range: Dynamic buffer based on historical volatility
      // Rationale: Full range should cover "reasonable" price moves to avoid showing
      // false out-of-range periods. Buffer scales with volatility:
      // - Low-medium vol (<20%): 30% buffer (e.g. stablecoins need tight bounds)
      // - Medium vol (20-50%): 50% buffer (e.g. ETH/USDC)
      // - High vol (>50%): 100% buffer (e.g. memecoins)
      const allPrices = hourlyData.map(h => parseFloat(h.token0Price))
      const historicalMin = Math.min(...allPrices)
      const historicalMax = Math.max(...allPrices)
      const priceRange = historicalMax - historicalMin
      const volatility = priceRange / historicalMin

      const bufferMultiplier = volatility < 0.2 ? 0.3 :
                              volatility < 0.5 ? 0.5 :
                              1.0
      effectiveMin = historicalMin * (1 - bufferMultiplier)
      effectiveMax = historicalMax * (1 + bufferMultiplier) 

   } else {
      // ===== CONCENTRATED RANGE MODE =====

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
         normalizedMinPrice = 1 / maxNum  // Invert and swap (min becomes max)
         normalizedMaxPrice = 1 / minNum
         normalizedAssumedPrice = 1 / assumedNum
      }

      // Step 2: Calculate token ratio using tick-based formula (see calculateTokenRatio.js)
      const ratioResult = calculateTokenRatio(
         normalizedAssumedPrice,
         normalizedMinPrice,
         normalizedMaxPrice,
         pool.feeTier
      )

      token0Percent = ratioResult.token0Percent
      token1Percent = ratioResult.token1Percent

      // Step 3: Split capital according to ratio
      capital0USD = capitalUSD * (token0Percent / 100)
      capital1USD = capitalUSD * (token1Percent / 100)
   
      // Step 4: Convert USD capital to token amounts
      amount0 = capital0USD / priceToken0InUSD
      amount1 = capital1USD / priceToken1InUSD
      
      // Step 5: Set effective range (no buffer needed for user-defined bounds)
      effectiveMin = normalizedMinPrice
      effectiveMax = normalizedMaxPrice
   }

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
   
   // Calculate liquidity normalization exponent
   // Context: On-chain liquidity is stored in raw units (e.g. 1e18 for USDC)
   // We must normalize using token decimals to compare user L with pool L
   const decimals0 = parseInt(pool.token0.decimals)
   const decimals1 = parseInt(pool.token1.decimals)
   const liquidityExponent = (decimals0 + decimals1) / 2
   

   // ===== STAGE 5: FEE ACCUMULATION LOOP =====
   // Loop through hourly snapshots to accumulate proportional fees

   const MAX_WARNINGS = 5 // Prevent console spam

   let totalFeesUSD = 0
   let hoursInRange = 0
   
   // Limit debug loss to first 3 iterations (prevents log flooding)
   let debugCount = 0

   for (let i = 0; i < hourlyData.length; i++) {
      const hour = hourlyData[i]

      // Validate hour data (TheGraph sometimes returns null/malformed snapshots)
      const hourPrice = parseFloat(hour.token0Price)
      const hourLiquidity = parseFloat(hour.liquidity)
      const hourFeesUSD = parseFloat(hour.feesUSD)

      if (isNaN(hourPrice) || isNaN(hourLiquidity) || isNaN(hourFeesUSD)) {
         continue // Skip corrupted hours
      }
      
      if (hourPrice <= 0 || hourLiquidity <= 0 || hourFeesUSD < 0) {
         continue // Note: feesUSD can be 0 (valid for low-activity hours), but not negative
      }

      // Check if price is in-range
      const priceInRange = hourPrice >= effectiveMin &&
                           hourPrice <= effectiveMax
      
      // 🔍 DIAGNOSTIC (first 3 iterations only)
      if (debugCount < 3) {
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

      if (!priceInRange) {
         continue // Skip out-of-range hours (user earns 0 fees)
      }

      // Calculate dynamic fee share using liquidity ratio
      // Formula: user_fees = total_fees × (L_user / L_pool)
      // Challenge: L_pool is stored in raw units (needs normalization)
      const L_pool_bigint = BigInt(hour.liquidity)

      if (L_pool_bigint <= 0) {
         continue // Skip hours with no pool liquidity (rare but possible)
      }

      // Normalize pool liquidity using token decimals
      // Example: 1e24 raw USDC liquidity → 1e24 / 10^((6+18)/2) = 1e12 human-readable
      const L_pool_normalized = Number(L_pool_bigint) / Math.pow(10, liquidityExponent)

      // Fee share = user liquidity / total liquidity
      const feeShare = L_user / (L_pool_normalized + L_user)

      // Accumulate fees
      totalFeesUSD += hourFeesUSD * feeShare
      hoursInRange++
   }

   if (warnings.length === MAX_WARNINGS) {
      warnings.push(`... and ${hoursInRange - MAX_WARNINGS} more anomalies. Pool data may be unstable.`)
   }

   // Validation: Position must have been in-range at least once
   if (hoursInRange === 0) {
      const actualPriceRange = {
         min: Math.min(...hourlyData.map(h => parseFloat(h.token0Price))),
         max: Math.max(...hourlyData.map(h => parseFloat(h.token0Price)))
      }

      return {
         success: false,
         error: `Price never entered range (${effectiveMin.toFixed(6)}-${effectiveMax.toFixed(6)}). Actual range: ${actualPriceRange.min.toFixed(6)}-${actualPriceRange.max.toFixed(6)}`,
         dataQuality: quality
      }
   }

   // Calculate summary stats
   const percentInRange = (hoursInRange / hourlyData.length) * 100

   // Adjust data quality based on anomaly rate
   let finalQuality = quality
   const anomalyRate = warnings.length / hourlyData.length

   if (anomalyRate > 0.5) {
      finalQuality = "INSUFFICIENT"
   } else if (anomalyRate > 0.2) {
      finalQuality = quality === "EXCELENT" ? "RELIABLE" :
                     quality === "RELIABLE" ? "INSUFFICIENT" :
                     quality
   }

   if (finalQuality !== quality) {
      warnings.unshift(`⚠️ Data quality downgraded to ${finalQuality} due to ${warnings.length} anomalies`)
   }
   
   
   // ===== STAGE 6: IMPERMANENT LOSS (IL) CALCULATION =====

   // Get price endpoints (first and last snapshots)
   const initialPrice = parseFloat(hourlyData[0].token0Price)
   const finalPrice = parseFloat(hourlyData[hourlyData.length - 1].token0Price)

   // 6.2 Validate price data
   if (isNaN(initialPrice) || isNaN(finalPrice) || initialPrice <= 0 || finalPrice <= 0) {
      return {
         success: false,
         error: "Invalid price data for IL calculation",
         dataQuality: quality
      }
   }

   // Classic IL formula: 2 × √(price_ratio) / (1 + price_ratio) - 1
   const IL_decimal = calculateIL(initialPrice, finalPrice)
   const IL_percent = IL_decimal * 100


   // ===== STAGE 7: APR & P&L CALCULATION =====

   // Calculate time period (TheGraph poolHourData = 1 snapshot per hour)
   const daysOfData = hourlyData.length / 24

   // Calculate APR (annualized fee return)
   const feeReturnPercent = (totalFeesUSD / capitalUSD) * 100
   const APR = feeReturnPercent * (365 / daysOfData)

   // Calculate hold value (what capital would be worth if held in wallet)
   // Limitation: Uses current pool TVL to infer final token prices
   // (historical TVL not available in hourlyData schema)
   const initialAmount0 = amount0
   const initialAmount1 = amount1

   const finalPriceToken1InUSD = tvlUSD / 
      (tvl0 / finalPrice + tvl1)
   const finalPriceToken0InUSD = finalPriceToken1InUSD / finalPrice

   const holdValue = (initialAmount0 * finalPriceToken0InUSD) +
                     (initialAmount1 * finalPriceToken1InUSD)

   warnings.push("Hold value uses current pool TVL for price inference. Minor inaccuracy possible")
   
   // Calculate LP position value (capital + IL impact, before fees)
   const lpValue = capitalUSD * (1 + IL_decimal)

   // Calculate net P&L (fees - IL)
   const netPnL = totalFeesUSD + (lpValue - capitalUSD)
   const netPnlPercent = (netPnL / capitalUSD) * 100

   // Calculate hold P&L for comparison
   const holdPnL = holdValue - capitalUSD
   const holdPnLPercent = (holdPnL / capitalUSD) * 100

   return { 
      success: true,

      // Fee metrics
      totalFeesUSD,
      feeReturnPercent,
      APR,
      dailyFeesUSD: totalFeesUSD / daysOfData,
      daysOfData,

      // Range metrics
      hoursInRange,
      percentInRange,

      // IL metrics
      IL_percent,

      // P&L comparison
      lpValue,
      holdValue,
      netPnL,
      netPnlPercent,
      holdPnL,
      holdPnLPercent,

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
      warnings: warnings.slice(0, MAX_WARNINGS)
   }
}
