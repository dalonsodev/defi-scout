import { describe, it, expect } from 'vitest'
import { calculateFeesWithQuality } from './calculateFeesWithQuality'
import { RawPoolHourData } from '../../../../types'

describe('calculateFeesWithQuality', () => {
  it('returns success with accumulated fees', () => {
    const hourlyData = [
      { token0Price: '3000', liquidity: '1000000000000000000000000', feesUSD: '100' },
      { token0Price: '3100', liquidity: '1000000000000000000000000', feesUSD: '150' }
    ] as RawPoolHourData[]

    const result = calculateFeesWithQuality({
      hourlyData,
      effectiveMin: 2500,
      effectiveMax: 3500,
      L_user: 1e12,
      initialQuality: 'EXCELLENT'
    })

    expect(result.success).toBe(true)

    if (!result.success) throw new Error('Expected success result')

    expect(result.totalFeesUSD).toBeGreaterThan(0)
    expect(result.hoursInRange).toBe(2)
  })

  it('downgrades quality when anomaly rate > 20%', () => {
    const hourlyData = [
      { token0Price: '3000', liquidity: '1000000000000000000000000', feesUSD: '100' },
      { token0Price: 'NaN', liquidity: '1000000000000000000000000', feesUSD: '100' },
      { token0Price: 'NaN', liquidity: '1000000000000000000000000', feesUSD: '100' },
      { token0Price: '3100', liquidity: '1000000000000000000000000', feesUSD: '100' }
    ] as RawPoolHourData[]

    const result = calculateFeesWithQuality({
      hourlyData: hourlyData,
      effectiveMin: 2500,
      effectiveMax: 3500,
      L_user: 1e12,
      initialQuality: 'EXCELLENT'
    })

    expect(result.success).toBe(true)

    if (!result.success) throw new Error('Expected success result')

    expect(result.finalQuality).toBe('RELIABLE') // Downgraded (2/4 = 50% anomaly)
  })
})
