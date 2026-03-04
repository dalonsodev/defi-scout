import { tickToPrice } from "../../calculator/utils/uniswapV3Ticks"

/**
 * Process Tick Data for display in Liquidity Distribution chart (BarChart)
 *
 * @param {Object} tickData
 * @param {number} tickData.tick - Current active tick
 * @param {string} tickData.liquidity - Active liquidity at current tick (BigInt as string)
 * @param {Object[]} tickData.ticks - Ordered tick array (up to 1000 items)
 * @param {number} selectedTokenIdx - 0 or 1 depending on selected token scale
 *
 * @returns {Object[]} result
 * @returns {number} result.price - Price at midpoint of each tick range
 * @returns {number} result.liquidity - Active liquidity for each individual bar's range
 */
export function processTickData(tickData, selectedTokenIdx) {
  if (!tickData || !tickData.ticks || tickData.ticks.length < 2) return []

  const { tick: currentTick, liquidity: poolLiquidity, ticks } = tickData

  // Find split point
  const splitIdx = ticks.findIndex((t) => Number(t.tickIdx) > Number(currentTick))

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
    const midTick = (Number(ticks[i].tickIdx) + Number(ticks[i + 1].tickIdx)) / 2
    const rawPrice = tickToPrice(midTick)
    const price = selectedTokenIdx === 0 ? rawPrice : 1 / rawPrice
    const liquidity = Math.max(0, liquidities[i])   // clamp float precision errors

    result.push({ price, liquidity })
  }

  // Sort ascending by price
  // Natural order is ascending for token0; inversion makes it descending -> re-sort
  result.sort((a, b) => a.price - b.price)

  return result
}
