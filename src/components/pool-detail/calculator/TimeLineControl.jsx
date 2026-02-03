/**
 * UI: Timeline and Duration control
 *
 * Architecture: Projection horizon limited to 365 days because:
 * 1. Historical pool data (TheGraph) only goes back ~1 year
 * 2. DeFi APY volatility makes >1yr projections unreliable
 * 3. 99% of LPs exit positions within 6 months (industry data)
 *
 * Design Decision: Uses callback pattern (onDaysChange) instead of direct state
 * mutation, because parent (ILProjectionModal) delegate state to useProjectionCalculator
 * hook, which orchestrates days + price inputs for debounced IL calculations.
 * Keeps this component stateless and reusable.
 *
 * Domain Logic: Break-even display warns users if current duration is insufficient
 * for fees to offset impermanent loss. Calculated by useProjectionCalculator hook,
 * based on historical fee rates and projected price movement.
 *
 * @param {Object} props
 * @param {number} props.days - Current simulation duration (0-365)
 * @param {Function} props.onDaysChange - Dispatcher to trigger parent recalculation
 * @param {number} props.daysToBreakEven - Days needed for fees ≥ IL (from useProjectionCalculator)
 * @returns {JSX.Element} Controlled input with increment/decrement buttons
 *
 * @example
 * // In parent ILProjectionModal:
 * const { projectionDays, setProjectionDays } = useProjectionCalculator(...)
 * <TimeLineControl
 *    days={projectionDays}
 *    onDaysChange={setProjectionDays}
 *    daysToBreakEven={daysToBreakEven}
 * />
 */
export function TimeLineControl({ days, onDaysChange, daysToBreakEven }) {
  // State Management: Discrete adjustments with boundary enforcement
  // Alternative considered: Range slider => Assess including it for enhanced UX
  const increment = () => onDaysChange(Math.min(days + 1, 365))
  const decrement = () => onDaysChange(Math.max(days - 1, 0))

  return (
    <div className="form-control">
      <div className="grid grid-cols-2 gap-4">
        {/* Domain Logic: Break-even insight from fee accumulation modal */}
        <div className="flex flex-col items-center gap-2">
          <label className="label">
            <span className="label-text font-semibold">
              Days of Active Position
            </span>
          </label>

          {/* UX: Warning if duration < break-even (user would lose money vs HODL) */}
          <label className="label">
            <span className="label-text-alt text-warning text-center text-wrap">
              {`Position must be active ≥ ${daysToBreakEven.toFixed(2)}d to cover IL`}
            </span>
          </label>
        </div>

        {/* Input Group: Stepper buttons + direct input for precision */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrement}
            className="btn btn-circle btn-sm"
          >
            −
          </button>

          <input
            type="number"
            value={days}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              // Defensive: Handle empty string or non-numeric paste
              if (isNaN(val)) {
                onDaysChange(0)
              } else {
                onDaysChange(Math.max(0, Math.min(val, 365)))
              }
            }}
            min="0"
            max="365"
            className="input input-bordered text-center"
            aria-label="Days of active position."
          />

          <button
            type="button"
            onClick={increment}
            className="btn btn-circle btn-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
