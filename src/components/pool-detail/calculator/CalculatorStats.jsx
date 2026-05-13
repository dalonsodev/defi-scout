import { useState } from 'react'
import { ILProjectionModal } from './ILProjectionModal'

function PlaceholderStats({ isPulsing = false }) {
  const pulseClass = isPulsing ? 'animate-pulse' : ''

  return (
    <>
      <div className={`text-success mb-4 text-4xl font-bold ${pulseClass}`}>
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
        <h2 className="mb-2 text-lg font-semibold">Estimated Fees (24h)</h2>
        <PlaceholderStats isPulsing />
        <div className="flex gap-2">
          <button disabled className="btn btn-sm btn-glass flex-1 mt-4 rounded-xl opacity-50">
            Simulate Position Performance
          </button>
        </div>
      </>
    )
  }

  // Validation: Invalid range or zero-liquidity edge cases
  if (!results.success) {
    if (results.warning) {
      return (
        <>
          <h2 className="mb-2 text-lg font-semibold">Estimated Fees (24h)</h2>
          <PlaceholderStats />
          <div className="alert alert-warning mt-4 text-xs font-semibold">
            {results.warning}
          </div>
        </>
      )
    } else {
      return (
        <>
          <h2 className="mb-2 text-lg font-semibold">Estimated Fees (24h)</h2>
          <PlaceholderStats />
          <div className="alert alert-error mt-4 text-xs font-semibold">
            {results.error}
          </div>
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

  return (
    <>
      <h2 className="mb-2 text-lg font-semibold">Estimated Fees (24h)</h2>
      <div className="text-success mb-4 text-4xl font-bold">
        ${dailyFees.toFixed(2)}
      </div>

      <div className="mb-4 space-y-2">
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

      {/* Data quality warnings from assessDataQuality (LIMITED tier) and anomaly detection */}
      {results.warnings.length > 0 &&
        results.warnings.map((warning) => (
          <div key={warning} className="alert alert-warning mb-4 text-xs">
            {`⚠️ ${warning}`}
          </div>
        ))
      }

      <div className="flex gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-sm btn-glass flex-1 rounded-xl"
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
