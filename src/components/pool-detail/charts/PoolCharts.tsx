import type { ReactNode } from 'react'
import { LiquidityChart } from './LiquidityChart'
import { PriceChart } from './PriceChart'
import { TVLVolumeChart } from './TVLVolumeChart'
import { ChartSkeleton } from './ChartSkeleton'
import type {
  FormattedHourlyData,
  RawPool,
  PoolTickResult,
  UserInputs,
  FormattedPoolHistory
} from '../../../types'

interface PoolChartsProps {
  pool: RawPool
  history: FormattedPoolHistory[]
  hourlyData: FormattedHourlyData[]
  selectedTokenIdx: number
  tokenSymbols: [string, string]
  rangeInputs: UserInputs
  currentPrice: number
  tickData: PoolTickResult
  tickError: string | null
  hourlyIsLoading: boolean
  tickIsLoading: boolean
}

/**
 * UI: Pool Analytics Dashboard.
 * Orchestrates the layout and data distribution for historical price,
 * liquidity, and yield charts.
 * @param props
 * @param props.history - Timeseries data from the pool API
 * @param props.selectedTokenIdx - Index of the token used as base price (0 or 1)
 * @param props.tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param props.rangeInputs - Current simulation range (minPrice, maxPrice, assumedPrice)
 * @param props.currentPrice - Real-time market price for reference line
 */
export function PoolCharts({
  pool,
  history,
  hourlyData,
  selectedTokenIdx,
  tokenSymbols,
  rangeInputs,
  currentPrice,
  tickData,
  tickError,
  hourlyIsLoading,
  tickIsLoading
}: PoolChartsProps): ReactNode {
  // UI/UX: Empty state
  if (!history?.length) {
    return (
      <div className="card bg-base-200 rounded-2xl p-8 text-center">
        <p className="text-base-content/60">No historical data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tickIsLoading ? (
        <ChartSkeleton />
      ) : (
        <LiquidityChart
          selectedTokenIdx={selectedTokenIdx}
          tokenSymbols={tokenSymbols}
          token0Decimals={Number(pool.token0.decimals)}
          token1Decimals={Number(pool.token1.decimals)}
          rangeInputs={rangeInputs}
          currentPrice={currentPrice}
          tickData={tickData}
          tickError={tickError}
        />
      )}
      {hourlyIsLoading ? (
        <ChartSkeleton />
      ) : (
        <PriceChart
          hourlyData={hourlyData}
          selectedTokenIdx={selectedTokenIdx}
          tokenSymbols={tokenSymbols}
          rangeInputs={rangeInputs}
          currentPrice={currentPrice}
        />
      )}
      <TVLVolumeChart history={history} />
    </div>
  )
}
