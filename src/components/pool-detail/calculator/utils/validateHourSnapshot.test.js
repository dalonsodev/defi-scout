import { describe, it, expect } from 'vitest'
import { validateHourSnapshot } from './validateHourSnapshot'

describe('validateHourSnapshot', () => {
  describe('Happy path', () => {
    it('should accept valid numeric values', () => {
      const hour = { token0Price: 2500, liquidity: 1e24, feesUSD: '123.45' }
      expect(validateHourSnapshot(hour)).toBe(true)
    })

    it('should accept valid string values (TheGraph format)', () => {
      const hour = {
        token0Price: '2500.50',
        liquidity: '1000000',
        feesUSD: '123.45',
      }
      expect(validateHourSnapshot(hour)).toBe(true)
    })

    it('should accept feesUSD === 0 (low activity hour)', () => {
      const hour = { token0Price: 2500, liquidity: 1e20, feesUSD: 0 }
      expect(validateHourSnapshot(hour)).toBe(true)
    })
  })

  describe('NaN detection', () => {
    it('should reject non-parseable token0Price', () => {
      const hour = { token0Price: 'NaN', liquidity: 1e20, feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })

    it('should reject non-parseable liquidity', () => {
      const hour = { token0Price: 2500, liquidity: 'abc', feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })

    it('should reject non-parseable feesUSD', () => {
      const hour = { token0Price: 2500, liquidity: 1e20, feesUSD: undefined }
      expect(validateHourSnapshot(hour)).toBe(false)
    })
  })

  describe('Negative value rejection', () => {
    it('should reject negative token0Price', () => {
      const hour = { token0Price: -2500, liquidity: 1e20, feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })

    it('should reject negative liquidity', () => {
      const hour = { token0Price: 2500, liquidity: -1e20, feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })

    it('should reject negative feesUSD', () => {
      const hour = { token0Price: 2500, liquidity: 1e20, feesUSD: -50 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })
  })

  describe('Zero value handling', () => {
    it('should reject zero token0Price (price cannot be zero)', () => {
      const hour = { token0Price: 0, liquidity: 1e20, feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })

    it('should reject zero liquidity (pool cannot have 0 liquidity)', () => {
      const hour = { token0Price: 2500, liquidity: 0, feesUSD: 100 }
      expect(validateHourSnapshot(hour)).toBe(false)
    })
  })
})
