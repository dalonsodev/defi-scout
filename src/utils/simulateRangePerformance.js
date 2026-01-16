import { assessDataQuality } from "./assessDataQuality"
import { calculateTokenRatio } from "./calculateTokenRatio"

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
      if (assumedPrice == null) {
         return {
            success: false,
            error: "Assumed Entry Price required when full range is off"
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

   // 4.2 Get current price from first hourly snapshot (PARSE TO NUMBER)
   const currentPrice = parseFloat(hourlyData[0].token0Price)

   // Validate currentPrice
   if (isNaN(currentPrice) || currentPrice <= 0) {
      return {
         success: false,
         error: "Invalid current price from hourly data",
         dataQuality: quality
      }
   }

   // 4.3 Calculate USD prices using inference formula (PARSE pool values too)
   const tvlUSD = parseFloat(pool.totalValueLockedUSD)
   const tvl0 = parseFloat(pool.totalValueLockedToken0)
   const tvl1 = parseFloat(pool.totalValueLockedToken1)

   const priceToken1InUSD = tvlUSD / (tvl0 / currentPrice + tvl1)
   const priceToken0InUSD = priceToken1InUSD / currentPrice

   // 4.3.1 Validate calculated prices
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

   // 4.4 Calculate token composition + effective range
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

      // Step 1: Normalize user inputs to token0Price scale
      let normalizedMinPrice = minPrice
      let normalizedMaxPrice = maxPrice
      let normalizedAssumedPrice = assumedPrice

      if (selectedTokenIdx === 1) {
         // User inputs are in token1Price scale (e.g., "USDT per WETH" = 3107)
         // Convert to token0Price scale (e.g., "WETH per USDT" = 1/3107)
         normalizedMinPrice = 1 / maxPrice  // Invert and swap
         normalizedMaxPrice = 1 / minPrice
         normalizedAssumedPrice = 1 / assumedPrice
      }

      // Step 2: Calculate token ratio using tick-based formula
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
   
      // Step 4: Convert to token amounts
      amount0 = capital0USD / priceToken0InUSD
      amount1 = capital1USD / priceToken1InUSD
      
      // Step 5: Set effective range (no buffer needed, user-defined)
      effectiveMin = normalizedMinPrice
      effectiveMax = normalizedMaxPrice
   }

   // 🔍 DIAGNOSTIC
   console.log('🔍 Composition:', {
      mode: fullRange ? 'FULL_RANGE' : 'CONCENTRATED',
      token0Percent,
      token1Percent,
      capital0USD: capital0USD.toFixed(2),
      capital1USD: capital1USD.toFixed(2)
   })
   console.log('🔍 Effective Range:', { 
      effectiveMin: effectiveMin.toFixed(8), 
      effectiveMax: effectiveMax.toFixed(8) 
   })

   // 4.6 Calculate fee share using TVL ratio (simpler and accurate)
   // User's position TVL relative to pool TVL
   const userTVL = capitalUSD
   const poolTVL = tvlUSD

   // Base fee share (if user was in same range as entire pool)
   const baseFeeShare = userTVL / poolTVL

   // 🔍 DIAGNOSTIC
   console.log('🔍 Fee Share Calculation:', {
      userTVL: userTVL.toFixed(2),
      poolTVL: poolTVL.toFixed(2),
      baseFeeShare: (baseFeeShare * 100).toFixed(6) + '%'
   })
   

   // ===== STAGE 5: FEE ACCUMULATION LOOP =====
   
   // 5.0 Pre-loop validations
   const MAX_WARNINGS = 5

   // 5.1 Initialize accumulators
   let totalFeesUSD = 0
   let hoursInRange = 0
   
   // 5.2 Loop through hourly data
   let debugCount = 0  // ⭐ Contador para limitar logs

   for (let i = 0; i < hourlyData.length; i++) {
      const hour = hourlyData[i]

      // 5.3 Validate hour data (PARSE strings)
      const hourPrice = parseFloat(hour.token0Price)
      const hourLiquidity = parseFloat(hour.liquidity)
      const hourFeesUSD = parseFloat(hour.feesUSD)

      if (isNaN(hourPrice) || isNaN(hourLiquidity) || isNaN(hourFeesUSD)) {
         continue // Skip corrupted hours
      }
      
      if (hourPrice <= 0 || hourLiquidity <= 0 || hourFeesUSD < 0) {
         continue // Note: feesUSD can be 0 (valid), but not negative
      }

      // 5.4 Check if price is in-range
      const priceInRange = hourPrice >= effectiveMin &&
                           hourPrice <= effectiveMax
      
      // 🔍 DIAGNOSTIC (primeras 3 iteraciones)
      if (debugCount < 3) {
         console.log(`🔍 Hour ${i}:`, {
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
         continue // Skip out-of-range hours
      }

      // 5.5 Use base fee share (simplified, no liquidity math)
      const feeShare = baseFeeShare

      // 🔍 DIAGNOSTIC (first hour in-range)
      if (hoursInRange === 0) {
         console.log('🔍 First hour in range:', {
            baseFeeShare: (baseFeeShare * 100).toFixed(6) + "%",
            hourFeesUSD,
            feesAccumulated: (hourFeesUSD * feeShare).toFixed(4)
         })
      }

      // 5.6 Accumulate fees
      totalFeesUSD += hourFeesUSD * feeShare
      hoursInRange++
   }

   // ⭐ Log final después del loop
   console.log('🔍 Loop Summary:', {
      totalFeesUSD: totalFeesUSD.toFixed(4),
      hoursInRange,
      totalHours: hourlyData.length,
      percentInRange: ((hoursInRange / hourlyData.length) * 100).toFixed(1) + "%"
   })

   if (warnings.length === MAX_WARNINGS) {
      warnings.push(`... and ${hoursInRange - MAX_WARNINGS} more anomalies. Pool data may be unstable.`)
   }

   // 5.7 Check if position was ever in-range
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

   // 6.1 Get price endpoints (PARSE)
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

   // 6.3 Calculate IL using AMM formula (independent of token types)
   const priceRatio = finalPrice / initialPrice

   // Classic IL formula: 2 × √(ratio) / (1 + ratio) - 1
   const IL_decimal = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1
   const IL_percent = IL_decimal * 100


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

   const finalPriceToken1InUSD = tvlUSD / 
      (tvl0 / finalPrice + tvl1)
   const finalPriceToken0InUSD = finalPriceToken1InUSD / finalPrice

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
