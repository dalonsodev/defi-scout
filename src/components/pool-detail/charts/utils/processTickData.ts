import { tickToPrice } from '../../calculator/utils/uniswapV3Ticks'
import { PoolTickResult } from '../../../../types'

/**
 * Process Tick Data for display in Liquidity Distribution chart (BarChart)
 *
 * @param tickData
 * @param tickData.tick - Current active tick
 * @param tickData.liquidity - Active liquidity at current tick (BigInt as string)
 * @param tickData.ticks - Ordered tick array (up to 1000 items)
 * @param selectedTokenIdx - 0 or 1 depending on selected token scale
 *
 * @returns result
 * @returns result.price - Price at midpoint of each tick range
 * @returns result.liquidity - Active liquidity for each individual bar's range
 */
export function processTickData(
  tickData: PoolTickResult,
  selectedTokenIdx: number,
  token0Decimals: number,
  token1Decimals: number
): { price: number, liquidity: number }[] {

  if (!tickData || !tickData.ticks || tickData.ticks.length < 2) return []

  const { tick: currentTick, liquidity: poolLiquidity, ticks } = tickData

  // Find split point
  const splitIdx = ticks.findIndex(
    (t) => Number(t.tickIdx) > Number(currentTick)
  )

  if (splitIdx <= 0 || splitIdx >= ticks.length) return []

  // Anchor current range
  const liquidities = new Array(ticks.length - 1)
  liquidities[splitIdx - 1] = parseFloat(poolLiquidity)

  // Walk RIGHT: ranges above current
  for (let i = splitIdx; i < ticks.length - 1; i++) {
    liquidities[i] = liquidities[i - 1] + parseFloat(ticks[i].liquidityNet)
  }

  // Walk LEFT: ranges below current
  for (let i = splitIdx - 2; i >= 0; i--) {
    liquidities[i] = liquidities[i + 1] - parseFloat(ticks[i + 1].liquidityNet)
  }

  // Build output array
  const result = []

  for (let i = 0; i < ticks.length - 1; i++) {
    const midTick =
      (Number(ticks[i].tickIdx) + Number(ticks[i + 1].tickIdx)) / 2
    const rawPrice = tickToPrice(midTick)
    const humanPrice = rawPrice * Math.pow(10, token0Decimals - token1Decimals)
    const price = selectedTokenIdx === 0 ? 1 / humanPrice : humanPrice
    const liquidity = Math.max(0, liquidities[i]) // clamp float precision errors

    result.push({ price, liquidity })
  }

  // Sort ascending by price
  // Natural order is ascending for token0; inversion makes it descending -> re-sort
  result.sort((a, b) => a.price - b.price)

  const firstNonZero = result.findIndex((item) => item.liquidity > 0)

  if (firstNonZero === -1) return []

  const lastNonZero = result.findLastIndex((item) => item.liquidity > 0)

  return result.slice(firstNonZero, lastNonZero + 1)
}
