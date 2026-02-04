/**
 * Domain Logic: Statistical Significance Assessment
 *
 * Design Decision: Uses industry-standard time windows based on DeFi volatility patterns.
 * Rationale: 7-day minimum captures weekly cycles (Sat/Sun low volume), 30-day optimal
 * for detecting long-term trends vs temporary liquidity mining incentives.
 *
 * @param {Array} hourlyData - Array of { timestamp, feesUSD, tvlUSD } snapshots
 * @returns {Object} Quality report
 * @returns {string} return.quality - Rating: "INSUFFICIENT" | "LIMITED" | "RELIABLE" | "EXCELLENT"
 * @returns {string[]} return.warnings - User-facing messages (empty array if RELIABLE+)
 *
 * @example
 * const { quality, warnings } = assessDataQuality(pool30DaysData)
 * if (quality === "INSUFFICIENT") showDisclaimer(warnings[0])
 */
export function assessDataQuality(hourlyData) {
  // Defensive: Prevents crash if TheGraph query fails or returns null
  if (!hourlyData || !Array.isArray(hourlyData)) {
    return { quality: 'EMPTY', warnings: ['No data provided for analysis.'] }
  }

  const hours = hourlyData.length

  // Time Constants: Explicitly defined for maintainability (hours per period)
  const ONE_WEEK = 24 * 7 // 168h - Minumum to capture weekly volatility patterns
  const TWO_WEEKS = 24 * 14 // 336h - Captures bi-weekly rebalancing events
  const ONE_MONTH = 24 * 30 // 720h - Industry standard for LP projection tools

  // ===== QUALITY ASSESSMENT TIERS =====

  // 1. Critical: Less than 7 days is statistically insignificant for DeFi volume cycles
  if (hours < ONE_WEEK) {
    return {
      quality: 'INSUFFICIENT',
      warnings: [
        'Sample size too small (< 7 days). Projections are speculative.'
      ]
    }
  }

  // 2. Warning: 7 to 14 days captures weekly cycles but lacks long-term trend stability
  if (hours < TWO_WEEKS) {
    return {
      quality: 'LIMITED',
      warnings: [
        'Less than 14 days of data. Weekly volatility may skew results'
      ]
    }
  }

  // 3. Robust: 14 to 30 days is the industry standard for short-term LP projections
  // Reference: curve.finance, poolfish.xyz use 14-30d windows for fee APR calculations
  if (hours < ONE_MONTH) {
    return {
      quality: 'RELIABLE',
      warnings: []
    }
  }

  // 4. Optimal: +30 days accounts for monthly market cycles (options expiry, rebalancing)
  return {
    quality: 'EXCELLENT',
    warnings: []
  }
}
