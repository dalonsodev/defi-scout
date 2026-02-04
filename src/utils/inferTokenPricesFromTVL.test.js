import { describe, it, expect } from 'vitest'
import { inferTokenPricesFromTVL } from './inferTokenPricesFromTVL'

describe('inferTokenPricesFromTVL', () => {
  // Group 1: Existence
  describe('Edge Cases - Existence', () => {
    it('should fail if tvlUSD is missing', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: null,
        tvlToken0: 200_000,
        tvlToken1: 350_000,
        currentPrice: 3200
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Pool metadata incomplete. Cannot calculate prices.'
      )
    })

    it('should fail if tvlToken0 is missing', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: undefined,
        tvlToken1: 350_000,
        currentPrice: 3200
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Pool metadata incomplete. Cannot calculate prices.'
      )
    })

    it('should fail if currentPrice is missing', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: 200_000,
        tvlToken1: 350_000,
        currentPrice: null
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Pool metadata incomplete. Cannot calculate prices.'
      )
    })
  })

  // Group 2: NaN/Infinity
  describe('Edge Cases - NaN/Infinity', () => {
    it('should fail if currentPrice is NaN', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: 200_000,
        tvlToken1: 350_000,
        currentPrice: NaN
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid current price from hourly data.')
    })

    it('should fail if currentPrice is Infinity', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: 200_000,
        tvlToken1: 350_000,
        currentPrice: Infinity
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid current price from hourly data.')
    })

    it('should handle very small amounts without causing Infinity', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: 1e-20,
        tvlToken1: 1e-20,
        currentPrice: 3200
      })

      expect(result.success).toBe(true)
      expect(result.priceToken0InUSD).toBeLessThan(Infinity)
      expect(result.priceToken1InUSD).toBeLessThan(Infinity)
    })
  })

  // Group 3: Negative values
  describe('Edge Cases - Zero/Negative Values', () => {
    it('should fail if tvlUSD is zero', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 0,
        tvlToken0: 200_000,
        tvlToken1: 350_000,
        currentPrice: 3200
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Pool has no liquidity (TVL = $0).')
    })

    it('should fail if tvlToken0 is negative', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: -20_000,
        tvlToken1: 350_000,
        currentPrice: 3200
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Pool is imbalanced (one token at 0%). Cannot calculate prices.'
      )
    })

    it('should fail if tvlToken1 is zero', () => {
      const result = inferTokenPricesFromTVL({
        tvlUSD: 550_000,
        tvlToken0: 200_000,
        tvlToken1: 0,
        currentPrice: 3200
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        'Pool is imbalanced (one token at 0%). Cannot calculate prices.'
      )
    })
  })

  // Group 4: Happy Path
  describe('Happy Path', () => {
    it('should calculate prices correctly for balanced pool', () => {
      // ARRANGE: Pool ETH/USDC
      // - TVL: $1M USD
      // - 100 ETH ($3000 each) = $300k
      // - 700k USDC ($1 each) = $700k
      // - currentPrice (token0Price) = 3000 USDC per ETH

      const result = inferTokenPricesFromTVL({
        tvlUSD: 1_000_000,
        tvlToken0: 100, // ETH amount
        tvlToken1: 700_000, // USDC amount
        currentPrice: 3000 // USDC per ETH
      })

      // ASSERT
      expect(result.success).toBe(true)
      expect(result.priceToken0InUSD).toBeCloseTo(3000, 0) // ETH = ~$3000
      expect(result.priceToken1InUSD).toBeCloseTo(1, 0) // USDC = ~$1
    })
  })
})
