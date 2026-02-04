import { debugLog } from '../../../utils/logger'

/**
 * UI: Strategy Comparison Dashboard
 *
 * Architecture: Side-by-side layout (vs tabs) for instant visual comparison.
 * Rationale: Users need to compare 6-8 metrics simultaneously (token balances,
 * P&L, fees, IL). Tabs would require mental context switching.
 *
 * Winner Logic: Based solely on net PNL (not ROI%) because absolute profit
 * matters more for portfolio allocation decisions. If both strategies lose,
 * shows the smaller loss as "winner" (lesser evil).
 *
 * @param {Object} props
 * @param {Object} props.hodlStrategy - Buy-and-hold simulation results
 * @param {number} props.hodlStrategy.pnl - Net profit/loss in USD
 * @param {number} props.hodlStrategy.totalValue - Final portfolio value
 * @param {Object} props.lpStrategy - Uniswap V3 LP simulation results
 * @param {number} props.lpStrategy.pnl - Net P&L including fees and IL
 * @param {number} props.lpStrategy.feesEarned - Accumulated swap fees
 * @param {boolean} props.isCalculating - Loading state during simulation
 * @returns {JSX.Element} Comparison dashboard with winner highlight
 *
 * @example
 * <StrategyComparison
 *    hodlStrategy={{ pnl: 120.50, totalValue: 1120.50 }}
 *    lpStrategy={{ pnl: 95.30, feesEarned: 80, ilPercent: -5.2 }}
 *    isCalculating={false}
 * />
 */
export function StrategyComparison({
  hodlStrategy,
  lpStrategy,
  isCalculating
}) {
  // Architecture: Winner determined by absolute PNL (not ROI%)
  // Edge Case: Both strategies can be negative (shows lesser loss)
  const winner = lpStrategy?.pnl > hodlStrategy?.pnl ? 'lp' : 'hodl'

  debugLog('Simulation Results:', { hodlStrategy, lpStrategy })

  return (
    <div className="grid gap-4">
      <StrategyCard
        title="Strategy A: HODL"
        isWinner={winner === 'hodl'}
        data={hodlStrategy}
        isCalculating={isCalculating}
      />
      <StrategyCard
        title="Strategy B: Uniswap V3"
        isWinner={winner === 'lp'}
        data={lpStrategy}
        isCalculating={isCalculating}
      />
    </div>
  )
}

/**
 * UI: Strategy Presentation Card.
 *
 * Design Decision: Ring highlight (vs background color) to maintain dark-mode
 * consistency. DaisyUI's "ring-success" provides 2px green border without
 * conflicting with card's base-300 background.
 *
 * Data Flow: Receives pre-calculated metrics from useProjectionCalculator hook.
 * No local calculations to keep this component pure presentation.
 *
 * @param {Object} props
 * @param {string} props.title - Strategy name (e.g., "HODL", "Uniswap V3")
 * @param {boolean} props.isWinner - Triggers "Best" badge and success ring
 * @param {boolean} props.isCalculating - Shows skeleton loader during simulation
 * @param {Object} props.data - Simulation results from useProjectionCalculator
 * @param {number} props.data.amount0 - Final token0 balance after rebalancing
 * @param {number} props.data.amount1 - Final token1 balance
 * @param {number} props.data.token0Percent - Portfolio % in token0
 * @param {number} props.data.totalValue - Total USD value of position
 * @param {number} props.data.pnl - Net profit/loss in USD
 * @param {number} props.data.pnlPercent - P&L as percentage with sign
 * @param {number} [props.data.feesEarned] - LP-only: Accumulated swap fees
 * @param {string} [props.data.ilPercent] - LP-only: Impermanent loss %
 * @returns {JSX.Element} Financial metrics card with conditional LP data
 */
function StrategyCard({ title, isWinner, data, isCalculating }) {
  return (
    <div
      className={`
            card bg-base-300 rounded-2xl p-4 mb-4
            ${isWinner ? 'ring-2 ring-success' : ''}
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">{title}</h4>
        {isWinner && <span className="badge badge-success">Best</span>}
      </div>

      {isCalculating || !data ? (
        <div className="skeleton h-32" />
      ) : (
        <div className="space-y-2">
          {/* Asset Breakdown: Token balances after price movement/rebalancing */}
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/60">{data.token0Symbol}</span>
              <span>
                {data.amount0.toFixed(4)} ({data.token0Percent}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">{data.token1Symbol}</span>
              <span>
                {data.amount1.toFixed(4)} ({data.token1Percent}%)
              </span>
            </div>
          </div>

          <div className="divider my-2" />

          {/* Performance Metrics: P&L and Portfolio Valuation */}
          <div className="flex justify-between font-bold">
            <span>Value</span>
            <span>${data.totalValue.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>P&L</span>
            <span className={data.pnl >= 0 ? 'text-success' : 'text-error'}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)} (
              {data.pnlPercent}%)
            </span>
          </div>

          {/* Domain Logic: LP-specific metrics (IL and Fees) only for Uniswap V3 */}
          {data.feesEarned !== undefined && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Fees Earned</span>
                <span className="text-success">
                  +${data.feesEarned.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Impermanent Loss</span>
                <span className="text-error">{data.ilPercent}%</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
