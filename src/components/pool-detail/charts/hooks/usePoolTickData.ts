import { useState, useEffect } from 'react'
import { fetchPoolTicks } from '../../../../services/theGraphClient'
import { PoolTickResult } from '../../../../types'

interface PoolTickDataResult {
  tickData: PoolTickResult | null
  isLoading: boolean
  fetchError: string | null
}

/**
 * Custom Hook: Fetch and cache TheGraph liquidity data.
 *
 * @param poolId - Pool contract address
 * @param currentTick - Current active tick for reference
 * @param feeTier - Pool fee tier (100, 500, 3000, 10000 bps)
 *
 * @returns Liquidity data from TheGraph
 */
export function usePoolTickData(
  poolId: string,
  currentTick: number,
  feeTier: number
): PoolTickDataResult {

  const [tickData, setTickData] = useState<PoolTickResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!poolId || currentTick == null || !feeTier) return

    setIsLoading(true)
    setFetchError(null)

    let cancelled = false

    async function loadTickData() {
      try {
        const data = await fetchPoolTicks(poolId, currentTick)

        if (!cancelled) {
          setTickData(data)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn('❌ Fetch error:', err)
        if (!cancelled) {
          if (err instanceof Error) {
            setFetchError(err.message)
          } else {
            setFetchError('Unknown error occurred')
          }
          setIsLoading(false)
        }
      }
    }

    loadTickData()
    return () => { cancelled = true } // Cleanup: Prevents state update on unmounted component
  }, [poolId, currentTick, feeTier])

  return { tickData, isLoading, fetchError }
}
