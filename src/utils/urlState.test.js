import { describe, it, expect } from 'vitest'
import { parseSearchParams, buildCleanSearchParams } from './urlState'

/**
 * Test Suite: URL State Management
 *
 * Coverage Areas:
 * 1. Edge Cases - Invalid/malformed URL parameters
 * 2. Defaults - Fallback behavior when params are missing
 * 3. Clean URLs - Omitting default values from output
 * 4. Round-trip - Parse → Build → Parse consistency
 * 5. Performance - Sub-1ms parsing requirement
 *
 * WHY test pure functions first:
 * - Zero React dependencies (no mocking needed)
 * - Predictable inputs/outputs
 * - Fast execution (<1ms per test)
 * - Easy to debug failures
 */

describe('parseSearchParams', () => {
  // ============================================================
  // GROUP 1: EDGE CASES - Invalid/Malformed Input
  // ============================================================
  describe('Edge Cases - Invalid Input', () => {
    it('should handle non-numeric TVL gracefully', () => {
      const params = new URLSearchParams('?tvlUsd=abc123')
      const result = parseSearchParams(params)

      expect(result.tvlUsd).toBe('') // Fallback to default empty string
    })

    it('should handle negative TVL values', () => {
      const params = new URLSearchParams('?tvlUsd=-1000')
      const result = parseSearchParams(params)

      expect(result.tvlUsd).toBe('') // Filters should be positive only
    })

    it('should handle zero as invalid TVL threshold', () => {
      const params = new URLSearchParams('?tvlUsd=0')
      const result = parseSearchParams(params)

      expect(result.tvlUsd).toBe('') // Zero threshold = no filter
    })

    it('should handle negative volume values', () => {
      const params = new URLSearchParams('?volumeUsd1d=-500')
      const result = parseSearchParams(params)

      expect(result.volumeUsd1d).toBe('')
    })

    it('should handle invalid sort column', () => {
      const params = new URLSearchParams('?sortBy=invalidColumn')
      const result = parseSearchParams(params)

      expect(result.sortBy).toBe('tvlUsd') // Fallback to default
    })

    it('should handle invalid sort direction', () => {
      const params = new URLSearchParams('?sortDir=random')
      const result = parseSearchParams(params)

      expect(result.sortDir).toBe('desc') // Fallback to default
    })

    it('should handle negative page index', () => {
      const params = new URLSearchParams('?page=-5')
      const result = parseSearchParams(params)

      expect(result.page).toBe(0) // Pagination must be >= 0
    })

    it('should handle non-integer page values', () => {
      const params = new URLSearchParams('?page=3.14')
      const result = parseSearchParams(params)

      // JavaScript Number("3.14") = 3.14, but we don't validate decimals
      // This is acceptable since TanStack Table rounds internally
      expect(result.page).toBe(3.14)
    })
  })

  // ============================================================
  // GROUP 2: DEFAULTS - Missing Parameters
  // ============================================================
  describe('Defaults - Missing Parameters', () => {
    it('should return all defaults when URL is empty', () => {
      const params = new URLSearchParams('')
      const result = parseSearchParams(params)

      expect(result).toEqual({
        search: '',
        platforms: [],
        tvlUsd: '',
        volumeUsd1d: '',
        sortBy: 'tvlUsd',
        sortDir: 'desc',
        page: 0
      })
    })

    it('should use default sortBy when only sortDir is provided', () => {
      const params = new URLSearchParams('?sortDir=asc')
      const result = parseSearchParams(params)

      expect(result.sortBy).toBe('tvlUsd')
      expect(result.sortDir).toBe('asc') // User-provided value preserved
    })
  })

  // ============================================================
  // GROUP 3: VALID INPUT - Happy Path
  // ============================================================
  describe('Happy Path - Valid URL Parameters', () => {
    it('should parse all parameters correctly', () => {
      const params = new URLSearchParams(
        '?search=USDC&platforms=uniswap-v3,curve&tvlUsd=1000000&volumeUsd1d=50000&sortBy=apy&sortDir=asc&page=2'
      )
      const result = parseSearchParams(params)

      expect(result).toEqual({
        search: 'USDC',
        platforms: ['uniswap-v3', 'curve'],
        tvlUsd: '1000000',
        volumeUsd1d: '50000',
        sortBy: 'apyBase', // URL 'apy' → accessorKey 'apyBase'
        sortDir: 'asc',
        page: 2
      })
    })

    it('should convert URL sort params to table accessorKeys', () => {
      const testCases = [
        { url: 'tvl', expected: 'tvlUsd' },
        { url: 'vol', expected: 'volumeUsd1d' },
        { url: 'apy', expected: 'apyBase' },
        { url: 'platform', expected: 'platformName' }
      ]

      testCases.forEach(({ url, expected }) => {
        const params = new URLSearchParams(`?sortBy=${url}`)
        const result = parseSearchParams(params)
        expect(result.sortBy).toBe(expected)
      })
    })

    it('should deduplicate platform values', () => {
      const params = new URLSearchParams('?platforms=uniswap,curve,uniswap')
      const result = parseSearchParams(params)

      expect(result.platforms).toEqual(['uniswap', 'curve']) // No duplicates
    })

    it('should filter out empty platform strings', () => {
      const params = new URLSearchParams('?platforms=uniswap,,curve,')
      const result = parseSearchParams(params)

      expect(result.platforms).toEqual(['uniswap', 'curve']) // Empty strings removed
    })

    it('should preserve numeric strings for TVL/volume', () => {
      const params = new URLSearchParams('?tvlUsd=1000000&volumeUsd1d=50000')
      const result = parseSearchParams(params)

      // Keep as strings for <input type="number"> compatibility
      expect(typeof result.tvlUsd).toBe('string')
      expect(typeof result.volumeUsd1d).toBe('string')
      expect(result.tvlUsd).toBe('1000000')
      expect(result.volumeUsd1d).toBe('50000')
    })
  })
})

// ============================================================
// buildCleanSearchParams Tests
// ============================================================
describe('buildCleanSearchParams', () => {
  describe('Clean URLs - Omit Default Values', () => {
    it('should omit all default values from URL', () => {
      const state = {
        search: '',
        platforms: [],
        tvlUsd: '',
        volumeUsd1d: '',
        sortBy: 'tvlUsd',
        sortDir: 'desc',
        page: 0
      }
      const params = buildCleanSearchParams(state)

      expect(params.toString()).toBe('') // Completely clean URL
    })

    it('should only include non-default values', () => {
      const state = {
        search: 'USDC', // Non-default
        platforms: [],
        tvlUsd: '1000000', // Non-default
        volumeUsd1d: '',
        sortBy: 'tvlUsd',
        sortDir: 'desc',
        page: 0
      }
      const params = buildCleanSearchParams(state)

      expect(params.toString()).toBe('search=USDC&tvlUsd=1000000')
    })

    it('should convert accessorKeys back to short URL params', () => {
      const state = {
        search: '',
        platforms: [],
        tvlUsd: '',
        volumeUsd1d: '',
        sortBy: 'apyBase', // accessorKey
        sortDir: 'asc',
        page: 0
      }
      const params = buildCleanSearchParams(state)

      // Should convert apyBase → apy (and include sortDir since it's non-default)
      expect(params.get('sortBy')).toBe('apy')
      expect(params.get('sortDir')).toBe('asc')
    })

    it('should join platforms with commas', () => {
      const state = {
        search: '',
        platforms: ['uniswap-v3', 'curve', 'balancer-v2'],
        tvlUsd: '',
        volumeUsd1d: '',
        sortBy: 'tvlUsd',
        sortDir: 'desc',
        page: 0
      }
      const params = buildCleanSearchParams(state)

      expect(params.get('platforms')).toBe('uniswap-v3,curve,balancer-v2')
    })
  })
})

// ============================================================
// ROUND-TRIP TESTS - Parse → Build → Parse Consistency
// ============================================================
describe('Round-Trip Consistency', () => {
  it('should maintain state integrity through parse → build → parse', () => {
    const originalState = {
      search: 'ETH',
      platforms: ['uniswap-v3'],
      tvlUsd: '500000',
      volumeUsd1d: '10000',
      sortBy: 'apyBase',
      sortDir: 'asc',
      page: 3
    }

    // Build URL from state
    const params1 = buildCleanSearchParams(originalState)

    // Parse it back
    const parsedState = parseSearchParams(params1)

    // Build URL again
    const params2 = buildCleanSearchParams(parsedState)

    // Both URLs should be identical
    expect(params1.toString()).toBe(params2.toString())
  })

  it('should handle edge case: empty platforms array', () => {
    const state = {
      search: '',
      platforms: [],
      tvlUsd: '',
      volumeUsd1d: '',
      sortBy: 'tvlUsd',
      sortDir: 'desc',
      page: 0
    }

    const params = buildCleanSearchParams(state)
    const parsed = parseSearchParams(params)

    expect(parsed.platforms).toEqual([]) // Should remain empty array, not [""]
  })
})

// ============================================================
// PERFORMANCE TESTS
// ============================================================
describe('Performance Requirements', () => {
  it('should parse complex URL in under 1ms', () => {
    const params = new URLSearchParams(
      '?search=USDC&platforms=uniswap-v3,curve,sushiswap,balancer-v2&tvlUsd=1000000&volumeUsd1d=50000&sortBy=apy&sortDir=asc&page=10'
    )

    const start = performance.now()
    parseSearchParams(params)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1) // Sub-millisecond requirement
  })

  it('should build clean params in under 1ms', () => {
    const state = {
      search: 'Ethereum',
      platforms: ['uniswap-v3', 'curve', 'sushiswap'],
      tvlUsd: '5000000',
      volumeUsd1d: '100000',
      sortBy: 'volumeUsd1d',
      sortDir: 'desc',
      page: 5
    }

    const start = performance.now()
    buildCleanSearchParams(state)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1)
  })
})
