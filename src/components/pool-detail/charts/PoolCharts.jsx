import { LiquidityChart } from './LiquidityChart'
import { PriceChart } from './PriceChart'
import { TVLVolumeChart } from './TVLVolumeChart'
import { FeesApyChart } from './FeesApyChart'

/**
 * UI: Pool Analytics Dashboard.
 * Orchestrates the layout and data distribution for historical price,
 * liquidity, and yield charts.
 * @param {Object} props
 * @param {Array<Object>} props.history - Timeseries data from the pool API
 * @param {number} props.selectedTokenIdx - Index of the token used as base price (0 or 1)
 * @param {string[]} props.tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param {Object} props.rangeInputs - Current simulation range (minPrice, maxPrice, assumedPrice)
 * @param {number} props.currentPrice - Real-time market price for reference line
 * @returns {JSX.Element}
 */
export function PoolCharts({
  pool,
  history,
  hourlyData,
  selectedTokenIdx,
  tokenSymbols,
  rangeInputs,
  currentPrice
}) {
  // UI/UX: Empty state
  if (!history || history.length === 0) {
    return (
      <div className="card bg-base-200 rounded-2xl p-8 text-center">
        <p className="text-base-content/60">No historical data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <LiquidityChart
        poolId={pool.id}
        currentTick={pool.tick}
        feeTier={pool.feeTier}
        selectedTokenIdx={selectedTokenIdx}
        tokenSymbols={tokenSymbols}
        token0Decimals={pool.token0.decimals}
        token1Decimals={pool.token1.decimals}
        rangeInputs={rangeInputs}
        currentPrice={currentPrice}
      />
      <PriceChart
        hourlyData={hourlyData}
        selectedTokenIdx={selectedTokenIdx}
        tokenSymbols={tokenSymbols}
        rangeInputs={rangeInputs}
        currentPrice={currentPrice}
      />
      <TVLVolumeChart history={history} />
      <FeesApyChart history={history} />
    </div>
  )
}
