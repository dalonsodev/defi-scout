import type { FormattedPoolHistory, RawPoolDayData, RawPoolHistory } from '../../types'

/**
 * Utility: Transforms raw PoolDayData from The Graph into chart-ready format.
 * @param RawPoolDayData - Array of poolDayData objects from API
 * @returns Formatted pool history with parsed numbers and readable dates
 */

function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()

  return `${month} ${day}`
}

export function formatPoolHistory(rawPoolDayData: RawPoolDayData[]): FormattedPoolHistory[] {
  if (!rawPoolDayData?.length) {
    return []
  }
  return rawPoolDayData.map((day) => {
    // Normalization: Extract ISO date for consistent data key mapping
    const date = new Date(day.date * 1000)
    const dateString = date.toISOString().split('T')[0]
    const month = date.toLocaleString('en-US', { month: 'short' })
    const dayNum = date.getDate()
    const dayLabel = dayNum === 1 ? month : dayNum.toString()

    const tvlUSD = parseFloat(day.tvlUSD)
    const feesUSD = parseFloat(day.feesUSD)

    /**
     * Daily APY Extrapolation:
     * Logic: (daily fees / current TVL) * 365 days
     * NOTE: This represents a 24h performance snapshot projected annually,
     * which may show high volatility compared to the pool's lifetime average.
     */
    const apy = ((feesUSD * 365) / tvlUSD) * 100

    if (
      day.volumeUSD === undefined ||
      day.token0Price === undefined ||
      day.token1Price === undefined
    ) {
      throw new Error('Unable to format due to missing data')
    }

    return {
      date: dateString, /// Standard ISO format for filtering (e.g. "2024-01-01")
      dateTimestamp: day.date,
      // Note: formatDateShort creates its own Date object internally.
      // Refactor opportunity if performance becomes a concern.
      dateShort: formatDateShort(day.date),
      dayLabel,
      volumeUSD: parseFloat(day.volumeUSD) || 0,
      tvlUSD,
      feesUSD,
      token0Price: parseFloat(day.token0Price) || 0,
      token1Price: parseFloat(day.token1Price) || 0,
      apy: Number.isFinite(apy) ? apy : 0 // Safety: Prevent infinity values if TVL = 0
    }
  })
}
