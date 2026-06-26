interface Hour {
  token0Price: string
  liquidity: string
  feesUSD: string
}

/**
 * Utility: Validates hourly snapshot data from TheGraph for fee accumulation.
 *
 * Critical Checks (fail if violated):
 * - Numeric parsing success (corrupted JSON)
 * - Non NaN values (malformed responses)
 * - Non-negative numbers (domain invariant: price/liquidity/fees cannot be negative)
 *
 * Edge cases handled by caller:
 * - feesUSD === 0 (valid: low activity hour)
 * - price out of range (valid: position inactive)
 *
 * Pattern: Guard clauses with fail-fast (return false on first violation).
 * Trade-off: Speed over detailed error reporting.
 *
 * @param hour - TheGraph poolHourData snapshot
 * @param hour.token0Price - Price in token1 per token0
 * @param hour.liquidity - Total pool liquidity (raw units)
 * @param hour.feesUSD - Fees generated this hour (USD)
 *
 * @returns True if valid, false if corrupted/invalid
 *
 * @example
 * validateHourSnapshot({ token0Price: "2500", liquidity: "1e24", feesUSD: "123.45" })
 * // => true
 *
 * validateHourSnapshot({ token0Price: "NaN", liquidity: "-100", feesUSD: "50" })
 * // => false (NaN detected, negative liquidity)
 */
export function validateHourSnapshot(hour: Hour): boolean {
  const hourPrice = parseFloat(hour.token0Price)
  const hourLiquidity = parseFloat(hour.liquidity)
  const hourFeesUSD = parseFloat(hour.feesUSD)

  if (Number.isNaN(hourPrice) || Number.isNaN(hourLiquidity) || Number.isNaN(hourFeesUSD)) {
    return false
  }

  if (hourPrice <= 0 || hourLiquidity <= 0 || hourFeesUSD < 0) {
    return false
  }

  return true
}
