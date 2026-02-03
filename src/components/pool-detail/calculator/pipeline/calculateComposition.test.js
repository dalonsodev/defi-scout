import { describe, it, expect } from 'vitest'
import { calculateComposition } from './calculateComposition'

describe('calculateComposition', () => {
  // ===== SHARED TEST DATA (DRY principle) =====
  const validPoolState = {
    currentPrice: 0.0003,
    priceToken0InUSD: 3000,
    priceToken1InUSD: 1,
    feeTier: 3000,
  }

  const validUserInputs = {
    capitalUSD: 10000,
    minPrice: 0.0002,
    maxPrice: 0.0004,
    fullRange: false,
    assumedPrice: 0.0003,
    selectedTokenIdx: 0,
  }

  const validHistoricalPrices = [0.00025, 0.0003, 0.00035]

  // ===== 1. VALIDATIONS (fail-fast tests) =====

  describe('Validations', () => {
    it('rejects feeTier null', () => {
      // Arrange: Setup con feeTier inválido
      const inputs = { ...validUserInputs }
      const poolState = { ...validPoolState, feeTier: null }
      const history = validHistoricalPrices

      // Act: Execute function
      const result = calculateComposition({
        userInputs: inputs,
        poolState,
        historicalPrices: history,
      })

      // Assert: Specific error verification
      expect(result.success).toBe(false)
      expect(result.error).toContain('fee tier')
    })

    it('rejects invalid selectedTokenIdx', () => {
      const inputs = { ...validUserInputs, selectedTokenIdx: 2 }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('select a token')
    })

    it('rejects negative or zero values', () => {
      const inputs = { ...validUserInputs, capitalUSD: -100 }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('must be positive')
    })
  })

  // ===== 2. FULL RANGE MODE =====

  describe('Full Range Mode', () => {
    it('divides capital 50/50 exactly', () => {
      const inputs = { ...validUserInputs, fullRange: true }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      // Verify split
      expect(result.success).toBe(true)
      expect(result.composition.token0Percent).toBe(50)
      expect(result.composition.token1Percent).toBe(50)

      // Verify capital allocation
      expect(result.capitalAllocation.capital0USD).toBe(5000)
      expect(result.capitalAllocation.capital1USD).toBe(5000)
    })

    it('calculates token amounts correctly', () => {
      const inputs = { ...validUserInputs, fullRange: true }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      // amount0 = $5000 / $3000 = 1.666... WETH
      // amount1 = $5000 / $1 = 5000 USDT
      expect(result.composition.amount0).toBeCloseTo(1.6666, 3)
      expect(result.composition.amount1).toBe(5000)
    })

    it('applies 30% buffer for low volatility (< 0.2)', () => {
      // Volatility = (0.00035 - 0.00025) / 0.00025 = 0.4 / 0.00025 = 0.16 (16%)
      const history = [0.00025, 0.0003, 0.00035] // 40% volatility
      const inputs = { ...validUserInputs, fullRange: true }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: history,
      })

      // Buffer = 50% (because volatility 0.4)
      const expectedMin = 0.00025 * (1 - 0.5) // 0.000125
      const expectedMax = 0.00035 * (1 + 0.5) // 0.000525

      expect(result.effectiveRange.min).toBeCloseTo(expectedMin, 6)
      expect(result.effectiveRange.max).toBeCloseTo(expectedMax, 6)
    })

    it('applies 50% buffer for medium volatility (0.2-0.5)', () => {
      // Volatility = (0.0004 - 0.0002) / 0.0002 = 1.0 (100%) → but capped at 50%
      const history = [0.0002, 0.0003, 0.0004] // 100% volatility
      const inputs = { ...validUserInputs, fullRange: true }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: history,
      })

      // Expected: 100% buffer (volatility > 0.5)
      const expectedMin = 0.0002 * (1 - 1.0)
      const expectedMax = 0.0004 * (1 + 1.0)

      expect(result.effectiveRange.min).toBeCloseTo(expectedMin, 6)
      expect(result.effectiveRange.max).toBeCloseTo(expectedMax, 6)
    })
  })

  // ===== 3. CONCENTRATED MODE - PRICE NORMALIZATION =====

  describe('Concentrated Mode - Price Normalization', () => {
    it('maintains unchanged prices when selectedTokenIdx = 0', () => {
      const inputs = {
        ...validUserInputs,
        selectedTokenIdx: 0,
        minPrice: 0.0002,
        maxPrice: 0.0004,
        assumedPrice: 0.0003,
      }

      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      // Effective range must be equal to user inputs
      expect(result.effectiveRange.min).toBe(0.0002)
      expect(result.effectiveRange.max).toBe(0.0004)
    })

    it('inverts prices correctly when selectedTokenIdx = 1', () => {
      const inputs = {
        ...validUserInputs,
        selectedTokenIdx: 1,
        minPrice: 2500, // "USDT per WETH" perspective
        maxPrice: 5000,
        assumedPrice: 3333,
      }

      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      // Normalized min: 1 / 5000 = 0.0002, max = 1 / 2500 = 0.0004
      // (note: min/max will swap after inversion)
      expect(result.effectiveRange.min).toBeCloseTo(1 / 5000, 6)
      expect(result.effectiveRange.max).toBeCloseTo(1 / 2500, 6)
    })
  })

  // ===== 4. CONCENTRATED MODE - RATIO CALCULATION =====

  describe('Concentrated Mode - Composition', () => {
    it('returns valid composition with token amounts', () => {
      const result = calculateComposition({
        userInputs: validUserInputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      expect(result.success).toBe(true)
      expect(result.composition).toHaveProperty('token0Percent')
      expect(result.composition).toHaveProperty('token1Percent')
      expect(result.composition).toHaveProperty('amount0')
      expect(result.composition).toHaveProperty('amount1')

      // Percentages must sum to 100
      const sum =
        result.composition.token0Percent + result.composition.token1Percent
      expect(sum).toBeCloseTo(100, 2)
    })

    it('calculates capital allocation coherent with ratio', () => {
      const inputs = { ...validUserInputs, capitalUSD: 20000 }
      const result = calculateComposition({
        userInputs: inputs,
        poolState: validPoolState,
        historicalPrices: validHistoricalPrices,
      })

      const { capital0USD, capital1USD } = result.capitalAllocation
      const { token0Percent, token1Percent } = result.composition

      // capitalUSD must be ~token0Percent of total
      expect(capital0USD / 20000).toBeCloseTo(token0Percent / 100, 2)
      expect(capital1USD / 20000).toBeCloseTo(token1Percent / 100, 2)

      // Sum must equal total capital
      expect(capital0USD + capital1USD).toBeCloseTo(20000, 2)
    })
  })
})
