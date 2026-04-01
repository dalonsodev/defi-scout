import { useState } from 'react'
import { ILProjectionModal } from './ILProjectionModal'

function PlaceholderStats({ isPulsing = false }) {
  const pulseClass = isPulsing ? 'animate-pulse' : ''

  return (
    <>
      <div className={`text-4xl font-bold text-success mb-4 ${pulseClass}`}>
        $--
      </div>
      <div className="space-y-2">
        <div className={`flex justify-between ${pulseClass}`}>
          <span className="text-base-content/60">MONTHLY:</span>
          <span>$-- --%</span>
        </div>
        <div className={`flex justify-between ${pulseClass}`}>
          <span className="text-base-content/60">YEARLY (APR):</span>
          <span>$-- --%</span>
        </div>
      </div>
    </>
  )
}

/**
 * UI: Fee Projection Summary Card.
 * Displays estimated returns (daily/monthly/yearly) based on historical fee accrual rates.
 *
 * Model Assumptions:
 * - Fee velocity remains constant (valid for 7-30 day windows with stable volume)
 * - Capital compounds linearly (simplification: ignores IL rebalancing)
 * - Monthly APR = Yearly/12 (not compounded, for UX simplicity)
 *
 * @param {Object} props
 * @param {Object|null} props.results - Simulation output from simulateRangePerformance
 * @param {number} props.results.dailyFeesUSD - Projected 24h revenue
 * @param {number} props.results.APR - Annualized percentage rate
 * @param {number} props.results.daysOfData - Sample size for calculation (affects confidence)
 * @param {boolean} props.isLoading - Active computation state
 * @param {string|null} props.fetchError - GraphQL/network failure message
 * @param {Object} props.poolData - Pool metadata (prices, symbols, volume)
 * @param {Object} props.rangeInputs - User-defined range boundaries and capital
 * @returns {JSX.Element}
 */
export function CalculatorStats({
  results,
  isLoading,
  fetchError,
  poolData,
  rangeInputs
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Early Exit: Network/API failures
  if (fetchError) {
    return (
      <>
        <p className="text-error text-sm">
          Failed to load pool data: {fetchError}
        </p>
      </>
    )
  }

  // Loading State: Skeleton UI to reduce perceived latency
  if (isLoading || results === null) {
    return (
      <>
        <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
        <PlaceholderStats isPulsing />
      </>
    )
  }

  // Validation: Invalid range or zero-liquidity edge cases
  if (!results.success) {
    if (results.warning) {
      return (
      <>
        <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
        <PlaceholderStats />
        <div className="alert alert-warning text-xs font-semibold mt-4">{results.warning}</div>
      </>
    )
    } else {
      return (
        <>
          <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
          <PlaceholderStats />
          <div className="alert alert-error text-xs font-semibold mt-4">{results.error}</div>
        </>
      )
    }

  }

  // Linear Extrapolation: Assumes fee velocity ($/day/L) stays constant.
  // Valid for short-term (7-30 day) windows where volume/TVL ratio is stable.
  const dailyFees = results.dailyFeesUSD
  const monthlyFees = dailyFees * 30
  const yearlyFees = dailyFees * 365
  const yearlyAPR = results.APR
  const monthlyAPR = yearlyAPR / 12 // Simplified (not compounded) for readability

  // Statistical Confidence: <7 days = small sample, high variance
  const hasLimitedData = results.daysOfData < 7

  return (
    <>
      <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
      <div className="text-4xl font-bold text-success mb-4">
        ${dailyFees.toFixed(2)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-base-content/60">MONTHLY:</span>
          <span className="font-semibold">
            ${monthlyFees.toFixed(2)}{' '}
            <span className="text-success">{monthlyAPR.toFixed(2)}%</span>
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-base-content/60">YEARLY (APR):</span>
          <span className="font-semibold">
            ${yearlyFees.toFixed(2)}{' '}
            <span className="text-success">{yearlyAPR.toFixed(2)}%</span>
          </span>
        </div>
      </div>

      {/* Data Quality Warning: Low sample size increases projection variance */}
      {hasLimitedData && (
        <div className="alert alert-warning text-xs mb-4">
          ⚠️ Based on {results.daysOfData.toFixed(1)} days. Projections may
          vary.
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-sm btn-glass flex-1"
        >
          Simulate Position Performance
        </button>
      </div>

      <ILProjectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        poolData={poolData}
        rangeInputs={rangeInputs}
        results={results}
      />
    </>
  )
}
