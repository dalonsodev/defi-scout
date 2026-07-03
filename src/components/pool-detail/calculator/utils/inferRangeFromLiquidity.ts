interface ProcessedTick {
  price: number
  liquidity: number
  targetPtc?: number
}

interface RangeResults {
  minPrice: number | null
  maxPrice: number | null
}

/**
 * Utility: Infers range input hydration values from current liquidity.
 *
 * Design Decision: It "walks" the already sorted liquidity ticks to find
 * price points that encompass a specific percentage of the total liquidity
 * (e.g. 90%).
 *
 * Usage: It helps hydrate UI inputs for range-bound liquidity provision.
 *
 * @param processedTicks - Array of tick data objects
 * @param processedTicks[].price - Value at current tick
 * @param processedTicks[].liquidity - Active, at current tick
 * @param [targetPct=0.9] - Target depth to capture (0.0 to 1.0)
 * @returns An object containing minPrice and maxPrice or null
 */
export function inferRangeFromLiquidity(
  processedTicks: ProcessedTick[],
  targetPct = 0.6
): RangeResults | null {
  if (processedTicks.length < 2) return null

  const total = processedTicks.reduce((acc, curr) => acc + curr.liquidity, 0)

  if (total === 0) return null

  // Determine how much liquidity to ignore at the tails (edges)
  const sideCutoff = (1 - targetPct) / 2
  const lowerThreshold = total * sideCutoff
  const upperThreshold = total * (1 - sideCutoff)

  let cumulativeLiq = 0
  let minPrice = null
  let maxPrice = null

  // Walk the sorted list to find where cumulative liquidity hits thresholds
  for (let i = 0; i < processedTicks.length; i++) {
    cumulativeLiq += processedTicks[i].liquidity

    if (minPrice === null && cumulativeLiq >= lowerThreshold) {
      minPrice = processedTicks[i].price
    }

    if (maxPrice === null && cumulativeLiq >= upperThreshold) {
      maxPrice = processedTicks[i].price
    }

    // Efficiency: If both found, we can stop the loop early
    if (minPrice !== null && maxPrice !== null) break
  }

  return { minPrice, maxPrice }
}
