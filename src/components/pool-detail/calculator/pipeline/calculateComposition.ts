import { debugLog } from '../../../../utils/logger'
import { calculateTokenRatio } from '../utils/calculateTokenRatio'

interface UserInputs {
  capitalUSD: number
  fullRange: boolean
  minPrice: number
  maxPrice: number
  assumedPrice: number
  selectedTokenIdx: number
}

interface PoolState {
  currentPrice: number
  priceToken0InUSD: number
  priceToken1InUSD: number
  feeTier: number | null
}

interface CalculateCompositionParams {
  userInputs: UserInputs
  poolState: PoolState
  historicalPrices: number[]
}

interface TokenComposition {
  token0Percent: number
  token1Percent: number
  amount0: number
  amount1: number
}

interface CapitalAllocation {
  capital0USD: number
  capital1USD: number
}

interface EffectiveRange {
  min: number
  max: number
}

interface ProcessResultFailure {
  success: false
  error: string
}

interface ProcessResultSuccess {
  success: true
  composition: TokenComposition
  capitalAllocation: CapitalAllocation
  effectiveRange: EffectiveRange
  error?: string
}

type ProcessResults = ProcessResultFailure | ProcessResultSuccess

/**
 * Pipeline Stage 2: Calculates LP position composition and effective price bounds.
 *
 * Converts user-defined parameters into token amounts and capital allocation.
 * Supports two Uniswap paradigms:
 * - Full Range: 50/50 split with volatility-adjusted safety buffer (V2-style)
 * - Concentrated: Custom ratio derived from tick math for user-defined bounds (V3-style)
 *
 * @param params
 * @param params.userInputs - Form-controlled parameters
 * @param params.userInputs.capitalUSD - Total investment in USD
 * @param params.userInputs.minPrice - Lower price bound (in selectedToken scale)
 * @param params.userInputs.maxPrice - Upper price bound (in selectedToken scale)
 * @param params.userInputs.fullRange - Mode toggle (true=V2, false=V3)
 * @param params.userInputs.assumedPrice - Entry price for V3 mode
 * @param params.userInputs.selectedTokenIdx - Display scale (0=token0, 1=token1)
 *
 * @param params.poolState - Live on-chain state
 * @param params.poolState.currentPrice - Latest token0Price from TheGraph
 * @param params.poolState.priceToken0InUSD - Token0 market price
 * @param params.poolState.priceToken1InUSD - Token1 market price
 * @param params.poolState.feeTier - Pool fee (500/3000/10000 basis points)
 *
 * @param params.historicalPrices - 30-day token0Price history for volatility calc
 *
 * @returns Result
 * @returns returns.success
 * @returns [returns.error] - Validation failure message
 * @returns [returns.composition] - Token split (percentages + amounts)
 * @returns returns.composition.token0Percent - Allocation % for token0
 * @returns returns.composition.token1Percent - Allocation % for token1
 * @returns returns.composition.amount0 - Token0 quantity in human units
 * @returns returns.composition.amount1 - Token1 quantity in human units
 * @returns [returns.capitalAllocation] - USD breakdown
 * @returns returns.capitalAllocation.capital0USD
 * @returns returns.capitalAllocation.capital1USD
 * @returns [returns.effectiveRange] - Active bounds in token0Price scale
 * @returns returns.effectiveRange.min - Lower boundary
 * @returns returns.effectiveRange.max - Upper boundary
 */
export function calculateComposition({
  userInputs,
  poolState,
  historicalPrices
}: CalculateCompositionParams): ProcessResults {
  const { capitalUSD, minPrice, maxPrice, fullRange, assumedPrice, selectedTokenIdx } = userInputs

  const { currentPrice, priceToken0InUSD, priceToken1InUSD, feeTier } = poolState

  if (!feeTier) {
    return {
      success: false,
      error: 'No fee tier available. Pool data may be corrupted.'
    }
  }

  if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
    return {
      success: false,
      error: 'You must select a token.'
    }
  }

  if (capitalUSD <= 0 || minPrice <= 0 || maxPrice <= 0 || assumedPrice <= 0) {
    return {
      success: false,
      error: 'Values must be positive.'
    }
  }

  if (currentPrice <= 0 || priceToken0InUSD <= 0 || priceToken1InUSD <= 0) {
    return {
      success: false,
      error: 'Prices must be positive.'
    }
  }

  // ===== FULL RANGE MODE (V2-STYLE) =====
  if (fullRange) {
    // Fixed 50/50 split regardless of price (no impermanent loss mitigation)
    const token0Percent = 50
    const token1Percent = 50
    const capital0USD = capitalUSD / 2
    const capital1USD = capitalUSD / 2
    const amount0 = capital0USD / priceToken0InUSD
    const amount1 = capital1USD / priceToken1InUSD

    // Dynamic buffer: Scales with historical volatility to reduce out-of-range risk
    // Example: 10% volatility → 30% buffer, 50% volatility → 50% buffer, 100%+ → 100%
    const historicalMin = Math.min(...historicalPrices)
    const historicalMax = Math.max(...historicalPrices)
    const volatility = (historicalMax - historicalMin) / historicalMin

    const bufferMultiplier = volatility < 0.2 ? 0.3 : volatility < 0.5 ? 0.5 : 1.0

    const effectiveMin = historicalMin * (1 - bufferMultiplier)
    const effectiveMax = historicalMax * (1 + bufferMultiplier)

    return {
      success: true,
      composition: {
        token0Percent,
        token1Percent,
        amount0,
        amount1
      },
      capitalAllocation: {
        capital0USD,
        capital1USD
      },
      effectiveRange: {
        min: effectiveMin,
        max: effectiveMax
      }
    }
  }

  // ===== CONCENTRATED MODE (V3-STYLE) =====
  const minNum = Number(minPrice)
  const maxNum = Number(maxPrice)
  const assumedNum = Number(assumedPrice)

  // Step 1: Normalize price scale to protocol standard (token0Price)
  // UI displays prices relative to selected token (e.g. "3107 USDT per WETH")
  // but calculations require canonical token0Price scale ("0.000322 WETH per USDT")
  let normalizedMinPrice = minNum
  let normalizedMaxPrice = maxNum
  let normalizedAssumedPrice = assumedNum

  if (selectedTokenIdx === 1) {
    // Invert bounds: min/max swap when flipping perspective
    // Example: [2900, 3300] USDT/WETH → [1/3300, 1/2900] WETH/USDT
    normalizedMinPrice = 1 / maxNum
    normalizedMaxPrice = 1 / minNum
    normalizedAssumedPrice = 1 / assumedNum
  }

  // Step 2: Compute ratio using Uniswap V3 tick-based liquidity formula
  // See calculateTokenRatio.js for sqrt(price) math details
  const ratioResult = calculateTokenRatio(
    normalizedAssumedPrice,
    normalizedMinPrice,
    normalizedMaxPrice,
    feeTier
  )

  const token0Percent = ratioResult.token0Percent
  const token1Percent = ratioResult.token1Percent

  // Step 3: Allocate capital proportionally
  const capital0USD = capitalUSD * (token0Percent / 100)
  const capital1USD = capitalUSD * (token1Percent / 100)

  // Step 4: Convert USD values to token quantities (human-readable units, NOT wei)
  const amount0 = capital0USD / priceToken0InUSD
  const amount1 = capital1USD / priceToken1InUSD

  // Step 5: Set effective range (user-defined, no buffer needed)
  const effectiveMin = normalizedMinPrice
  const effectiveMax = normalizedMaxPrice

  // Debug output (only in dev mode, see logger.js)
  debugLog('Composition Calculated:', {
    mode: 'CONCENTRATED',
    token0Percent,
    token1Percent,
    capital0USD: capital0USD.toFixed(2),
    capital1USD: capital1USD.toFixed(2),
    effectiveMin: effectiveMin.toFixed(8),
    effectiveMax: effectiveMax.toFixed(8)
  })

  return {
    success: true,
    composition: {
      token0Percent,
      token1Percent,
      amount0,
      amount1
    },
    capitalAllocation: {
      capital0USD,
      capital1USD
    },
    effectiveRange: {
      min: effectiveMin,
      max: effectiveMax
    }
  }
}
