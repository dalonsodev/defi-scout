import { describe, it, expect } from 'vitest'
import { validateInputs } from './validateInputs.js'

describe('validateInputs - Edge Cases', () => {
  it('should fail if price range is inverted', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: 100,
      maxPrice: 50,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error.toLowerCase()).toContain('min price')
  })

  it('should pass with valid standard inputs', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: 50,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(true)
  })

  // NEW TESTS for coverage
  it('should fail if capital < $10', () => {
    const result = validateInputs({
      capitalUSD: 5,
      minPrice: 50,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('$10')
  })

  it('should fail if selectedTokenIdx is invalid', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: 50,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 5, // Invalid
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('select a token')
  })

  it('should fail if price range missing when fullRange=false', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: '',
      maxPrice: '',
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Price range required')
  })

  it('should fail if prices are negative', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: -10,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('positive')
  })

  it('should fail if assumedPrice missing when fullRange=false', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: 50,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: '',
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Assumed Entry Price required')
  })

  it('should fail if hourlyData insufficient', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: 50,
      maxPrice: 100,
      fullRange: false,
      assumedPrice: 75,
      selectedTokenIdx: 0,
      hourlyData: new Array(50).fill({}), // Less than 168
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('No hourly data')
  })

  it('should pass with fullRange=true (no price checks)', () => {
    const result = validateInputs({
      capitalUSD: 1000,
      minPrice: '',
      maxPrice: '',
      fullRange: true,
      assumedPrice: '',
      selectedTokenIdx: 0,
      hourlyData: new Array(168).fill({}),
    })
    expect(result.success).toBe(true)
  })
})
