import { useState, useEffect } from 'react'
import { fetchPoolTicks } from '../../../../services/theGraphClient'
import {
  tickToPrice,
  priceToTick,
  getTickSpacing,
  alignTickToSpacing
} from '../../calculator/utils/uniswapV3Ticks'

/**
 * Custom Hook: Fetch and cache TheGraph liquidity data.
 *
 * @param {string} poolId - Pool contract address
 * @param {number} currentTick - Current active tick for reference
 * @param {number} feeTier - Pool fee tier (100, 500, 3000, 10000 bps)
 *
 * @returns {{
 *   tickData: { tick, liquidity, ticks[] },
 *   isLoading: boolean,
 *   fetchError: string|null
 * }}
 */
export function usePoolTickData(poolId, currentTick, feeTier) {
  const [tickData, setTickData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!poolId || currentTick == null || !feeTier) return

    setIsLoading(true)
    setFetchError(null)

    let cancelled = false

    async function loadTickData() {
      try {
        const currentPrice = tickToPrice(currentTick)

        const minPrice = currentPrice * 0.25
        const maxPrice = currentPrice * 4
        const rawMinTick = priceToTick(minPrice)
        const rawMaxTick = priceToTick(maxPrice)

        const tickSpacing = getTickSpacing(feeTier)
        const alignedMinTick = alignTickToSpacing(rawMinTick, tickSpacing)
        const alignedMaxTick = alignTickToSpacing(rawMaxTick, tickSpacing)

        const data = await fetchPoolTicks(poolId, alignedMinTick, alignedMaxTick)

        if (!cancelled) {
          setTickData(data)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn('❌ Fetch error:', err)
        if (!cancelled) {
          setFetchError(err.message)
          setIsLoading(false)
        }
      }
    }

    loadTickData()
    return () => {
      cancelled = true
    } // Cleanup: Prevents state update on unmounted component
  }, [poolId, currentTick, feeTier])

  return { tickData, isLoading, fetchError }
}
