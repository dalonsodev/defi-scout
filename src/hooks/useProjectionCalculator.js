import { useState, useMemo, useEffect } from "react"
import { calculateTokenPrices } from "../utils/calculateTokenPrices"
import { calculateIL } from "../utils/calculateIL"

export function useProjectionCalculator(poolData, rangeInputs, results) {
   // Calculate current prices using utility
   const { token0PriceUSD, token1PriceUSD } = useMemo(() => {
      const currentPrice = parseFloat(poolData.token0Price)
      return calculateTokenPrices(poolData, currentPrice)
   }, [poolData])

   // User inputs state
   const [futureToken0Price, setFutureToken0Price] = useState(token0PriceUSD)
   const [futureToken1Price, setFutureToken1Price] = useState(token1PriceUSD)
   const [projectionDays, setProjectionDays] = useState(0)

   // Update state with current price change
   useEffect(() => {
      setFutureToken0Price(token0PriceUSD)
      setFutureToken1Price(token1PriceUSD)
   }, [token0PriceUSD, token1PriceUSD])

   /**
    * SIMPLIFICATIONS:
    * 1. Token amounts stay constant (amount0, amount1 from initial composition)
    *    Reality: AMM rebalances as price moves
    * 2. Fees projected linearly (dailyFeesUSD × days)
    *    Reality: Fee rate varies with volume/volatility
    * 3. Assumes position stays in-range entire period
    *    Reality: If price exits range, fees = 0
    * 
    * Accuracy: Good for ±20% price moves over 7-30 days
    */

   // Calculate strategies
   const { hodlStrategy, lpStrategy, daysToBreakEven } = useMemo(() => {
      if (!results?.success) {
         return { hodlStrategy: null, lpStrategy: null, daysToBreakEven: 0 }
      }
      if (futureToken0Price <= 0 || futureToken1Price <= 0) {
         return { hodlStrategy: null, lpStrategy: null, daysToBreakEven: 0 }
      }
      if (projectionDays < 0) {
         return { hodlStrategy: null, lpStrategy: null, daysToBreakEven: 0 }
      }

      const capitalUSD = rangeInputs.capitalUSD || 1000
      const { amount0, amount1, token0Percent, token1Percent } = results.composition
      
      // Calculate HODL value first
      const hodlFutureValue =
         amount0 * futureToken0Price +
         amount1 * futureToken1Price

      // Calculate IL
      const currentPoolPrice = token0PriceUSD / token1PriceUSD
      const futurePoolPrice = futureToken0Price / futureToken1Price
      const IL_decimal = calculateIL(currentPoolPrice, futurePoolPrice)
      const lpValueBeforeFees = capitalUSD * (1 + IL_decimal)

      // Calculate days to cover IL (catch up to HODL)
      const lpDeficit = hodlFutureValue - lpValueBeforeFees
      const daysToBreakEven = lpDeficit > 0 && results.dailyFeesUSD > 0
         ? lpDeficit / results.dailyFeesUSD
         : 0

      // ===== HODL STRATEGY =====

      const hodl = {
         token0Symbol: poolData.token0.symbol,
         token1Symbol: poolData.token1.symbol,
         amount0,
         amount1,
         token0Percent,
         token1Percent,
         totalValue: hodlFutureValue,
         pnl: hodlFutureValue - capitalUSD,
         pnlPercent: ((hodlFutureValue - capitalUSD) / capitalUSD * 100).toFixed(2)
      }

      // ===== LP STRATEGY =====
      const IL_percent = (IL_decimal * 100).toFixed(2)
      const projectedFees = projectionDays > 0
         ? results.dailyFeesUSD * projectionDays
         : 0
      const lpFutureValue = lpValueBeforeFees + projectedFees

      const lp = {
         token0Symbol: poolData.token0.symbol,
         token1Symbol: poolData.token1.symbol,
         amount0,
         amount1,
         token0Percent,
         token1Percent,
         totalValue: lpFutureValue,
         pnl: lpFutureValue - capitalUSD,
         pnlPercent: ((lpFutureValue - capitalUSD) / capitalUSD * 100).toFixed(2),
         feesEarned: projectedFees,
         ilPercent: IL_percent
      }

      return { hodlStrategy: hodl, lpStrategy: lp, daysToBreakEven }
   }, [
      results,
      futureToken0Price,
      futureToken1Price,
      projectionDays,
      rangeInputs.capitalUSD,
      token0PriceUSD,
      token1PriceUSD,
      poolData
   ])

   const isCalculating = !hodlStrategy || !lpStrategy

   return {
      // Calculated data
      hodlStrategy,
      lpStrategy,
      isCalculating,
      daysToBreakEven,

      // Current prices
      currentToken0PriceUSD: token0PriceUSD,
      currentToken1PriceUSD: token1PriceUSD,

      // Inputs state
      futureToken0Price,
      futureToken1Price,
      projectionDays,

      // Handlers
      setFutureToken0Price,
      setFutureToken1Price,
      setProjectionDays
   }
}