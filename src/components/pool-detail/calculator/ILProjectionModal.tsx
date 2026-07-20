import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../common/hooks/useFocusTrap'
import { useProjectionCalculator } from './hooks/useProjectionCalculator'
import { PriceInputSection } from './PriceInputSection'
import { StrategyComparison } from './StrategyComparison'
import { TimeLineControl } from './TimeLineControl'
import type { RawPoolHistory, UserInputs } from '../../../types'
import type { ProcessResult } from './utils/simulateRangePerformance'

interface ILProjectionModalProps {
  isOpen: boolean
  poolData: RawPoolHistory
  rangeInputs: UserInputs
  results: ProcessResult
  onClose: () => void
}

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
 * @param props
 * @param props.isOpen - Modal visibility state
 * @param props.poolData - Pool metadata (token prices, symbols, fee tier)
 * @param props.rangeInputs - User-defined range boundaries and initial capital
 * @param props.results - Base fee calculations from simulateRangePerformance
 * @param props.onClose - Cleanup callback (resets local simulation state)
 * @returns A React Portal
 */
export function ILProjectionModal({
  isOpen,
  poolData,
  rangeInputs,
  results,
  onClose
}: ILProjectionModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null)

  useFocusTrap(modalRef, isOpen, onClose)

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
  } = useProjectionCalculator(poolData, rangeInputs, results)

  return createPortal(
    <dialog
      className={`modal ${isOpen ? 'modal-open' : ''}`}
      aria-modal="true"
      aria-labelledby="simulate-position-modal"
    >
      <div
        ref={modalRef}
        className="modal-box glass-overlay max-w-xl rounded-2xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3
            id="simulate-position-modal"
            className="text-2xl font-bold"
          >
            Simulate Position Performance
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-glass"
            aria-label="Close modal"
          >
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
            daysToBreakEven={daysToBreakEven}
            onDaysChange={setProjectionDays}
          />
        </div>
      </div>

      {/* Backdrop: Click-outside-to-close */}
      <form
        method="dialog"
        onClick={onClose}
        className="modal-backdrop"
        aria-hidden="true"
      >
        <button tabIndex={-1}>close</button>
      </form>
    </dialog>,
    document.body
  )
}
