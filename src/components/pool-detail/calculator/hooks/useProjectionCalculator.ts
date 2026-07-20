import { useEffect, useMemo, useRef, useState } from 'react'
import { debugLog } from '../../../../utils/logger'
import { calculateIL } from '../utils/calculateIL'
import type { RawToken, UserInputs } from '../../../../types'
import type { ProcessResult } from '../utils/simulateRangePerformance'

interface PoolData {
  token0: RawToken
  token1: RawToken
  token0Price: string
}

export interface HoldStrategy {
  token0Symbol: string
  token1Symbol: string
  amount0: number
  amount1: number
  token0Percent: number
  token1Percent: number
  totalValue: number
  pnl: number
  pnlPercent: string
}

export interface LpStrategy {
  token0Symbol: string
  token1Symbol: string
  amount0: number
  amount1: number
  token0Percent: number
  token1Percent: number
  totalValue: number
  pnl: number
  pnlPercent: string
  feesEarned: number
  ilPercent: string
}

interface ProjectionCalculatorResult {
  // Calculated data
  hodlStrategy: HoldStrategy | null
  lpStrategy: LpStrategy | null
  isCalculating: boolean
  daysToBreakEven: number

  // Current prices
  currentToken0PriceUSD: number
  currentToken1PriceUSD: number

  // Inputs state
  futureToken0Price: number
  futureToken1Price: number
  projectionDays: number

  // Handlers
  setFutureToken0Price: (tokenPrice: number) => void
  setFutureToken1Price: (tokenPrice: number) => void
  setProjectionDays: (projectionDays: number) => void
}

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
 * @param poolData - Pool metadata from The Graph
 * @param poolData.token0 - Token0 metadata (symbol, decimals)
 * @param poolData.token1 - Token1 metadata
 * @param poolData.token0Price - Current pool price (token0/token1)
 *
 * @param rangeInputs - User-defined LP position parameters
 * @param rangeInputs.capitalUSD - Deposit amount in USD
 *
 * @param results - Output from simulateRangePerformance
 * @param results.success - Whether simulation completed
 * @param results.composition - Token amounts (amount0, amount1)
 * @param results.dailyFeesUSD - Historical daily fee earnings
 *
 * @returns Projection interface with position metrics, loading state, current prices and user-defined projections
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
  poolData: PoolData,
  rangeInputs: UserInputs,
  results: ProcessResult | null
): ProjectionCalculatorResult {
  const token0PriceUSD = results?.success ? results?.token0PriceUSD : 0
  const token1PriceUSD = results?.success ? results?.token1PriceUSD : 0

  // User Inputs: Future price scenario and time horizon
  const hasHydrated = useRef(false)
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
    if (hasHydrated.current) return
    if (token0PriceUSD <= 0) return

    setFutureToken0Price(token0PriceUSD)
    setFutureToken1Price(token1PriceUSD)
    hasHydrated.current = true
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
    const { amount0, amount1, token0Percent, token1Percent } = results.composition

    // ===== STRATEGY A: HODL (Buy and Hold) =====

    // HODL Value: Token quantities * future prices
    const hodlFutureValue = amount0 * futureToken0Price + amount1 * futureToken1Price

    const hodl: HoldStrategy = {
      token0Symbol: poolData.token0.symbol,
      token1Symbol: poolData.token1.symbol,
      amount0,
      amount1,
      token0Percent,
      token1Percent,
      totalValue: hodlFutureValue,
      pnl: hodlFutureValue - capitalUSD,
      pnlPercent: (((hodlFutureValue - capitalUSD) / capitalUSD) * 100).toFixed(2)
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
    const lpValueAfterIL = hodlFutureValue * (1 + IL_decimal)

    // Step 3: Add projected fee earnings
    const projectedFees = projectionDays > 0 ? results.dailyFeesUSD * projectionDays : 0

    const lpFutureValue = lpValueAfterIL + projectedFees

    const lp: LpStrategy = {
      token0Symbol: poolData.token0.symbol,
      token1Symbol: poolData.token1.symbol,
      amount0,
      amount1,
      token0Percent,
      token1Percent,
      totalValue: lpFutureValue,
      pnl: lpFutureValue - capitalUSD,
      pnlPercent: (((lpFutureValue - capitalUSD) / capitalUSD) * 100).toFixed(2),
      feesEarned: projectedFees,
      ilPercent: IL_percent
    }

    debugLog('💣 Composition Debug:', {
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
      ilLossUSD > 0 && results.dailyFeesUSD > 0 ? ilLossUSD / results.dailyFeesUSD : 0

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
    hodlStrategy,
    lpStrategy,
    isCalculating,
    daysToBreakEven,
    currentToken0PriceUSD: token0PriceUSD,
    currentToken1PriceUSD: token1PriceUSD,
    futureToken0Price,
    futureToken1Price,
    projectionDays,
    setFutureToken0Price,
    setFutureToken1Price,
    setProjectionDays
  }
}
