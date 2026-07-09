import { MiniSparkline } from '../../common/MiniSparkline'
import type { ReactNode } from 'react'
import type { SparklineCache } from '../../../hooks/useSparklines'

interface SparklineCellProps {
  poolId: string
  sparklineData: SparklineCache
}

/**
 * SparklineCell - Renders 14-day APY sparkline with freemium fallback
 *
 * @param poolId - Pool identifier for cache lookup
 * @param sparklineData - Global cache (poolId → APY history)
 */
export function SparklineCell({ poolId, sparklineData }: SparklineCellProps): ReactNode {
  const data = sparklineData?.[poolId]

  if (!data) {
    return (
      <div className="flex justify-center">
        <div
          className="tooltip tooltip-left cursor-help"
          data-tip="Upgrade to Pro for unlimited sparklines"
        >
          <span className="text-base-content/60 min-h-10 text-xs font-medium">⟢ Pro</span>
        </div>
      </div>
    )
  }

  return <MiniSparkline data={data} />
}
