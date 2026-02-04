import { useState, useMemo, useEffect } from 'react'
import { calculateTokenPrices } from '../utils/calculateTokenPrices'
import { calculateIL } from '../utils/calculateIL'

/**
 * Custom Hook: LP Strategy Projection Calculation
 *
 * Simulates two investments strategies (HODL vs Uniswap V3 LP) under a given
 * price movement scenario, accounting for impermanent loss and fee accumulation.
 *
 * Model Simplifications (for calculator UX):
 * 1. Token amounts stay constant => Reality: AMM rebalances as price moves
 * 2. Fees projected linearly (dailyFeesUSD * days) => Reality: Varies with volume
 * 3. Assumes position stay in-range => Reality: Out-of-range position earn 0 fees.
 *
 * Accuracy: Good for ±20% price moves over 7-30 days (typical rebalancing window)
 * For larger moves or longer periods, model diverges from on-chain reality.
 *
 * @param {Object} poolData - Pool metadata from The Graph
 * @param {Object} poolData.token0 - Token0 metadata (symbol, decimals)
 * @param {Object} poolData.token1 - Token1 metadata
 * @param {string} poolData.token0Price - Current pool price (token0/token1)
 *
 * @param {Object} rangeInputs - User-defined LP position parameters
 * @param {number} rangeInputs.capitalUSD - Deposit amount in USD
 *
 * @param {Object} results - Output from simulateRangePerformance
 * @param {boolean} results.success - Whether simulation completed
 * @param {Object} results.composition - Token amounts (amount0, amount1)
 * @param {number} results.dailyFeesUSD - Historical daily fee earnings
 *
 * @returns {Object} Projection interface
 * @returns {Object} returns.hodlStrategy - Buy-and-hold metrics (pnl, totalValue)
 * @returns {Object} returns.lpStrategy - LP metrics (pnl, feesEarned, ilPercent)
 * @returns {boolean} returns.isCalculating - Loading state
 * @returns {number} returns.daysToBreakEven - Days until LP fees offset IL
 * @returns {number} returns.currentToken0PriceUSD - Current USD price of token0
 * @returns {number} returns.currentToken1PriceUSD - Current USD price of token1
 * @returns {number} returns.futureToken0Price - User input (scenario price)
 * @returns {number} returns.futureToken1Price - User input
 * @returns {number} returns.projectionDays - User input (time horizon)
 * @returns {Function} returns.setFutureToken0Price - Update scenario price
 * @returns {Function} returns.setFutureToken1Price - Update scenario price
 * @returns {Function} returns.setProjectionDays - Update time horizon
 *
 * @example
 * const projection = useProjectionCalculator(pool, rangeInputs, simulationResults)
 *
 * // User changes future price prediction
 * projection.setFutureToken0Price(3500) // ETH goes to $3500
 * projection.setProjectionDays(30)      // 30-day horizon
 *
 * // Display results
 * console.log(projection.lpStrategy.pnl)    // => -$42.15 (IL dominates)
 * console.log(projection.daysToBreakEven)   // => 45 days (fees need time)
 */
export function useProjectionCalculator(
  poolData,
  rangeInputs,
  results,
  ethPriceUSD
) {
  // Price Inference: Calculate current USD prices from pool's token0Price
  const { token0PriceUSD, token1PriceUSD } = useMemo(() => {
    const currentPrice = parseFloat(poolData.token0Price)
    return calculateTokenPrices(
      poolData.token0,
      poolData.token1,
      ethPriceUSD,
      currentPrice
    )
  }, [poolData, ethPriceUSD])

  // User Inputs: Future price scenario and time horizon
  const [futureToken0Price, setFutureToken0Price] = useState(token0PriceUSD)
  const [futureToken1Price, setFutureToken1Price] = useState(token1PriceUSD)
  const [projectionDays, setProjectionDays] = useState(0)

  /**
   * Price Hydration Strategy
   *
   * Problem: Initial prices come from poolData (async loader).
   * Using useState(token0PriceUSD) captures stale value (undefined) on mount.
   *
   * Solution: useEffect syncs state once prices are computed.
   * React-idiomatic pattern for "derived initial state".
   *
   * Trade-off: One extra render (mount with 0, then update) vs simpler code.
   */
  useEffect(() => {
    setFutureToken0Price(token0PriceUSD)
    setFutureToken1Price(token1PriceUSD)
  }, [token0PriceUSD, token1PriceUSD])

  // Strategy Simulation: Calculate HODL vs LP outcomes under given scenario
  const { hodlStrategy, lpStrategy, daysToBreakEven } = useMemo(() => {
    /*
     * Early Return: Invalid State Handling
     *
     * Returns null strategies when:
     * 1. simulateRangePerformance failed (results.success = false)
     * 2. User entered invalid prices (≤ 0)
     * 3. Projection days is negative
     *
     * UI Contract: Consumer must check "isCalculating" before rendering,
     * and show placeholder like "Adjust inputs to see projection"
     */
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
    const { amount0, amount1, token0Percent, token1Percent } =
      results.composition

    // ===== STRATEGY A: HODL (Buy and Hold) =====

    // HODL Value: Token quantities * future prices
    const hodlFutureValue =
      amount0 * futureToken0Price + amount1 * futureToken1Price

    const hodl = {
      token0Symbol: poolData.token0.symbol,
      token1Symbol: poolData.token1.symbol,
      amount0,
      amount1,
      token0Percent,
      token1Percent,
      totalValue: hodlFutureValue,
      pnl: hodlFutureValue - capitalUSD,
      pnlPercent: (((hodlFutureValue - capitalUSD) / capitalUSD) * 100).toFixed(
        2
      )
    }

    // ===== STRATEGY B: LP (Uniswap V3) =====

    // Step 1: Calculate Impermanent Loss (price movement effect)
    const currentPoolPrice = token0PriceUSD / token1PriceUSD
    const futurePoolPrice = futureToken0Price / futureToken1Price

    // IL = 0% when futurePrice === currentPrice (no price change)
    /**
     * Impermanent Loss Calculation
     *
     * USes standard Uniswap V2/V3 formula:
     *    IL = (2 * √(price_ratio) / (1 + price_ratio)) - 1
     *
     * Source: Pintail's "Uniswap: A Good Deal for Liquidity Providers?"
     * https://pintail.medium.com/uniswap-a-good-deal-for-liquidity-providers-104c0b6816f2
     *
     * Returns: Decimal (e.g. -0.05 for 5% loss)
     */
    const IL_decimal = calculateIL(currentPoolPrice, futurePoolPrice)
    const IL_percent = (IL_decimal * 100).toFixed(2)

    // Step 2: Calculate LP position value after IL (before fees)
    // IL reduces position value relative to HODL
    const lpValueAfterIL = capitalUSD * (1 + IL_decimal)

    // Step 3: Add projected fee earnings
    const projectedFees =
      projectionDays > 0 ? results.dailyFeesUSD * projectionDays : 0

    const lpFutureValue = lpValueAfterIL + projectedFees

    const lp = {
      token0Symbol: poolData.token0.symbol,
      token1Symbol: poolData.token1.symbol,
      amount0,
      amount1,
      token0Percent,
      token1Percent,
      totalValue: lpFutureValue,
      pnl: lpFutureValue - capitalUSD,
      pnlPercent: (((lpFutureValue - capitalUSD) / capitalUSD) * 100).toFixed(
        2
      ),
      feesEarned: projectedFees,
      ilPercent: IL_percent
    }

    console.log('💣 Composition Debug:', {
      amount0,
      amount1,
      token0Decimals: poolData.token0.decimals,
      token1Decimals: poolData.token1.decimals,
      expectedAmount1: (500 / token1PriceUSD).toFixed(6), // 50% del capital en token1
      actualVsExpected: amount1 / (500 / token1PriceUSD)
    })

    // ===== BREAKEVEN ANALYSIS =====

    // Days needed for fees to offset IL loss
    const ilLossUSD = hodlFutureValue - lpValueAfterIL
    const daysToBreakEven =
      ilLossUSD > 0 && results.dailyFeesUSD > 0
        ? ilLossUSD / results.dailyFeesUSD
        : 0

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
