import { PriceInputSection } from './PriceInputSection'
import { TimeLineControl } from './TimeLineControl'
import { StrategyComparison } from './StrategyComparison'
import { useProjectionCalculator } from './hooks/useProjectionCalculator'

/**
 * UI: IL (Impermanent Loss) vs HODL Strategy Simulator
 * Compares LP position (concentrated liquidity + fee accrual) against passive holding.
 *
 * IL Explained: Opportunity cost from AMM rebalancing when prices diverge.
 * Formula: IL% = (LP_Value / HODL_Value) - 1
 *
 * Performance: Heavy computation (rebalancing simulation at each price tick).
 * Results debounced via useProjectionCalculator to prevent lag on input changes.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Cleanup callback (resets local simulation state)
 * @param {Object} props.poolData - Pool metadata (token prices, symbols, fee tier)
 * @param {Object} props.rangeInputs - User-defined range boundaries and initial capital
 * @param {Object} props.results - Base fee calculations from simulateRangePerformance
 * @returns {JSX.Element}
 */
export function ILProjectionModal({
  isOpen,
  onClose,
  poolData,
  rangeInputs,
  results,
  ethPriceUSD
}) {
  // Hook Orchestration: Manages complex IL math + debounced recalculation.
  // Simulates AMM rebalancing at each price move, calculates cumulative fees,
  // and compares final LP value vs simple HODL (buy-and-hold).
  const {
    hodlStrategy,
    lpStrategy,
    isCalculating, // True during debounce window (prevents UI flash)
    currentToken0PriceUSD,
    currentToken1PriceUSD,
    futureToken0Price,
    futureToken1Price,
    projectionDays,
    setFutureToken0Price,
    setFutureToken1Price,
    setProjectionDays,
    daysToBreakEven
  } = useProjectionCalculator(poolData, rangeInputs, results, ethPriceUSD)

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-xl bg-base-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Simulate Position Performance</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            x
          </button>
        </div>

        {/* Strategy Comparison Cards */}
        <StrategyComparison
          hodlStrategy={hodlStrategy}
          lpStrategy={lpStrategy}
          isCalculating={isCalculating}
        />

        {/* Simulation Controls */}
        <div className="space-y-6">
          <PriceInputSection
            token0Symbol={poolData.token0.symbol}
            token1Symbol={poolData.token1.symbol}
            currentToken0PriceUSD={currentToken0PriceUSD}
            currentToken1PriceUSD={currentToken1PriceUSD}
            futureToken0PriceUSD={futureToken0Price}
            futureToken1PriceUSD={futureToken1Price}
            onToken0PriceChange={setFutureToken0Price}
            onToken1PriceChange={setFutureToken1Price}
          />
          <TimeLineControl
            days={projectionDays}
            onDaysChange={setProjectionDays}
            daysToBreakEven={daysToBreakEven}
          />
        </div>
      </div>

      {/* Backdrop: Click-outside-to-close */}
      <form method="dialog" onClick={onClose} className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}
