import { assessDataQuality } from "./assessDataQuality"

export function simulateRangePerformance({
   capitalUSD,
   minPrice,
   maxPrice,
   fullRange,
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
      if (minPrice == null || maxPrice == null) {
         return { 
            success: false, 
            error: "Price range required when Full Range is off" 
         }
      }
      if (minPrice <= 0 || maxPrice <= 0) {
         return { success: false, error: "Prices must be positive" }
      }
      if (minPrice >= maxPrice) {
         return { 
            success: false, 
            error: "Min Price must be lower than Max Price" 
         }
      }
   }

   if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
      return { success: false, error: "You must select a token"}
   }

   
   // ===== STAGE 2: DATA QUALITY ASSESSMENT =====
   const { quality, warnings } = assessDataQuality(hourlyData)
   
   
   // ===== STAGE 3: BLOCKING DECISION =====
   // If quality ===== "INSUFFICIENT" → return error
   if (quality === "INSUFFICIENT") {
      return { 
         success: false, 
         error: "Pool needs 7+ days of data",
         quality
      }
   }
   
   // ===== STAGE 4: LIQUIDITY CALCULATION =====
   // 4.1 Validate pool metadata
   if (!pool?.totalValueLockedToken0 || !pool?.totalValueLockedToken1) {
      return {
         success: false,
         error: "Pool metadata incomplete. Cannot calculate liquidity.",
         dataQuality: quality
      }
   }

   // 4.2 Get current price from first hourly snapshot
   const currentPrice = hourlyData[0].token0Price

   // 4.3 Calculate USD prices using inference formula
   const priceToken0InUSD = pool.totalValueLockedUSD /
      (pool.totalValueLockedToken0 + pool.totalValueLockedToken1 / currentPrice)
   const priceToken1InUSD = priceToken0InUSD / currentPrice

   // 4.3.1 Validate calculated prices
   if (pool.totalValueLockedUSD <= 0) {
      return {
         success: false,
         error: "Pool has no liquidity (TVL = $0)",
         dataQuality: quality
      }
   }

   if (pool.totalValueLockedToken0 <= 0 || pool.totalValueLockedToken1 <= 0) {
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

   // 4.4 Split capital 50/50 and convert to token amounts
   const capitalPerToken = capitalUSD / 2
   const amount0 = capitalPerToken / priceToken0InUSD
   const amount1 = capitalPerToken / priceToken1InUSD

   // 4.5 Determine effective range (handle fullRange case)
   let effectiveMin
   let effectiveMax
   
   if (fullRange) {
      const allPrices = hourlyData.map(h => h.token0Price)
      const minPrice = Math.min(...allPrices)
      const maxPrice = Math.max(...allPrices)
      const priceRange = maxPrice - minPrice
      const volatility = priceRange / minPrice

      const bufferMultiplier = volatility < 0.2 ? 0.3 :
                              volatility < 0.5 ? 0.5 :
                              1.0
      effectiveMin = minPrice * (1 - bufferMultiplier)
      effectiveMax = maxPrice * (1 + bufferMultiplier)                 
   } else {
      effectiveMin = minPrice
      effectiveMax = maxPrice
   }

   // 4.6 Calculate user liquidity using Poolfish formula
   const sqrtPriceUpper = Math.sqrt(effectiveMax)
   const sqrtPriceLower = Math.sqrt(effectiveMin)

   let L_user

   if (selectedTokenIdx === 0) {
      L_user = amount0 * Math.sqrt(currentPrice) / (sqrtPriceUpper - sqrtPriceLower)
   } else {
      L_user = amount1 / (sqrtPriceUpper - sqrtPriceLower)
   }

   
   // ===== STAGE 5: FEE ACCUMULATION LOOP =====
   // 5.0 Pre-loop validations
   if (L_user <= 0 || !isFinite(L_user)) {
      return {
         success: false,
         error: "Invalid liquidity calculation",
         dataQuality: quality
      }
   }
   // Sanity check: your initial liquidity shouldn't exceed pool's liquidity
   if (L_user > hourlyData[0].liquidity) {
      warnings.push("Your position would be larger than initial pool liquidity")
   }
   
   const MAX_WARNINGS = 5

   // 5.1 Initialize accumulators
   let totalFeesUSD = 0
   let hoursInRange = 0
   
   // 5.2 Loop through hourly data
   for (let i = 0; i < hourlyData.length; i++) {
      const hour = hourlyData[i]

      // 5.3 Validate hour data (skip corrupted/incomplete hours)
      if (hour.token0Price == null || hour.liquidity == null || 
         hour.feesUSD == null) {
            continue
      }

      if (hour.token0Price <= 0 || hour.liquidity <= 0 || 
         hour.feesUSD <= 0) {
         continue
      }

      // 5.4 Check if price is in-range
      const priceInRange = hour.token0Price >= effectiveMin &&
                           hour.token0Price <= effectiveMax
      
      if (!priceInRange) {
         continue // Skip out-of-range hours
      }

      // 5.5 Calculate fee share
      const L_total = hour.liquidity

      // Edge Case 1: Skip if pool is empty
      if (L_total === 0) {
         continue
      }

      // Edge Case 2: Cap fee share at 100%
      const rawFeeShare = L_user / L_total
      const feeShare = Math.min(L_user / L_total, 1.0)

      if (rawFeeShare > 1) {
         warnings.push(`High liquidity share (${(rawFeeShare * 100).toFixed(1)}%) detected at hour ${i}. Pool may be unstable.`)
      }

      if (rawFeeShare > 0.5 && warnings.length < MAX_WARNINGS) {
         warnings.push(`High liquidity share (${(rawFeeShare * 100).toFixed(1)}%) detected at hour ${i}`)
      }

      // 5.6 Accumulate fees
      totalFeesUSD += hour.feesUSD * feeShare
      hoursInRange++
   }

   if (warnings.length === MAX_WARNINGS) {
      warnings.push(`... and ${hoursInRange - MAX_WARNINGS} more anomalies. Pool data may be unstable.`)
   }

   // 5.7 Check if position was ever in-range
   if (hoursInRange === 0) {
      const actualPriceRange = {
         min: Math.min(...hourlyData.map(h => h.token0Price)),
         max: Math.min(...hourlyData.map(h => h.token0Price))
      }

      return {
         success: false,
         error: `Price never entered range (${effectiveMin.toFixed(2)}-${effectiveMax.toFixed(2)}). Actual range: ${actualPriceRange.min.toFixed(2)}-${actualPriceRange.max.toFixed(2)}`,
         dataQuality: quality
      }
   }

   // 5.8 Calculate summary stats
   const percentInRange = (hoursInRange / hourlyData.length) * 100

   // 5.9 Adjust data quality based on anomalies
   let finalQuality = quality // Start with Stage 2 assessment
   const anomalyRate = warnings.length / hourlyData.length

   if (anomalyRate > 0.5) {
      finalQuality = "INSUFFICIENT"
   } else if (anomalyRate > 0.2) {
      finalQuality = quality === "EXCELENT" ? "RELIABLE" :
                     quality === "RELIABLE" ? "INSUFFICIENT" :
                     quality // Already LIMITED or INSUFFICIENT
   }

   // add meta-warning if quality drops
   if (finalQuality !== quality) {
      warnings.unshift(`⚠️ Data quality downgraded to ${finalQuality} due to ${warnings.length} anomalies`)
   }
   
   // ===== STAGE 6: IL CALCULATION =====
   // 6.1 Get price endpoints
   const initialPrice = hourlyData[0].token0Price
   const finalPrice = hourlyData[hourlyData.length - 1].token0Price

   // 6.2 Validate price data
   if (initialPrice <= 0 || finalPrice <= 0) {
      return {
         success: false,
         error: "Invalid price data for IL calculation",
         dataQuality: quality
      }
   }

   // 6.3 Calculate IL using AMM formula (independent of token types)
   const priceRatio = finalPrice / initialPrice

   // Classic IL formula: 2 × √(ratio) / (1 + ratio) - 1
   const IL_decimal = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio - 1)
   const IL_percent = IL_decimal * 100

   // 6.4 Add disclaimer for concentrated ranges
   if (!fullRange) {
      warnings.push("IL calculated using full-range formula. Actual IL may be lower for concentrated positions.")
   }


   // ===== STAGE 7: APR CALCULATION =====

   // 7.1 Calculate time period
   const daysOfData = hourlyData.length / 24

   // 7.2 Calculate APR (annualized fee return)
   const feeReturnPercent = (totalFeesUSD / capitalUSD) * 100
   const APR = feeReturnPercent * (365 / daysOfData)

   // 7.3 Simplified hold value (assume price changes, quantities stay same)
   // Use current pool TVL to infer prices (best approximation without historical TVL)
   const initialAmount0 = amount0
   const initialAmount1 = amount1

   const finalPriceToken0InUSD = pool.totalValueLockedUSD / 
      (pool.totalValueLockedToken0 + pool.totalValueLockedToken1 / finalPrice)
   const finalPriceToken1InUSD = finalPriceToken0InUSD / finalPrice

   const holdValue = (initialAmount0 * finalPriceToken0InUSD) +
                     (initialAmount1 * finalPriceToken1InUSD)

   warnings.push("Hold value uses current pool TVL for price inference. Minor inaccuracy possible")
   
   // 7.4 Calculate LP position value (with IL)
   const lpValue = capitalUSD * (1 + IL_decimal)

   // 7.5 Calculate net P&L (fees - IL)
   const netPnL = totalFeesUSD + (lpValue - capitalUSD)
   const netPnlPercent = (netPnL / capitalUSD) * 100

   // 7.6 Calculate hold P&L for comparison
   const holdPnL = holdValue - capitalUSD
   const holdPnLPercent = (holdPnL / capitalUSD) * 100

   return { 
      success: true,

      // Fee metrics
      totalFeesUSD,
      feeReturnPercent,
      APR,

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

      // Meta
      dataQuality: finalQuality,
      warnings: warnings.slice(0, MAX_WARNINGS)
   }
}
