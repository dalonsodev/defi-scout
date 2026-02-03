import { useLoaderData, Link } from 'react-router-dom'
import { useCallback, useEffect, useState, useRef } from 'react'
import { TokenInfoBlock } from './TokenInfoBlock'
import { PoolCharts } from './charts/PoolCharts'
import { RangeCalculator } from './calculator/RangeCalculator'
import { invertPriceRange } from './calculator/utils/invertPriceRange'
import { usePoolHourlyData } from './calculator/hooks/usePoolHourlyData'

/**
 * Architecture: Pool Analytics & Strategy Dashboard.
 * State orchestrator for liquidity simulation and historical trend visualization.
 * @returns {JSX.Element}
 */
export function PoolDetail() {
  const { pool, history, ethPriceUSD } = useLoaderData()
  const { hourlyData, isLoading, fetchError } = usePoolHourlyData(pool.id)
  const hasHydrated = useRef(false)
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0)
  const [rangeInputs, setRangeInputs] = useState({
    capitalUSD: 1000,
    fullRange: false,
    minPrice: '',
    maxPrice: '',
    assumedPrice: '',
  })

  /**
   * Hydration: Initialize default ±10% range on first load.
   * Runs once when hourlyData becomes available, respecting early token selection.
   * Flag prevent re-hydration if user manually clears inputs (intentional blank state).
   */
  useEffect(() => {
    if (hasHydrated.current) return
    if (rangeInputs.minPrice !== '' || rangeInputs.maxPrice !== '') return
    if (!hourlyData) return

    const currentPrice = parseFloat(hourlyData[0].token0Price)
    const basePrice = selectedTokenIdx === 0 ? currentPrice : 1 / currentPrice

    setRangeInputs((prev) => ({
      ...prev,
      minPrice: basePrice * 0.9,
      maxPrice: basePrice * 1.1,
      assumedPrice: basePrice,
    }))

    hasHydrated.current = true

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourlyData, selectedTokenIdx])
  // Justification: rangeInputs.minPrice/maxPrice are guards, not triggers.
  // Including them would cause unnecessary effect re-runs on every input change.

  const handleTokenChange = useCallback(
    (newIdx) => {
      const invertedPrices = invertPriceRange({
        minPrice: rangeInputs.minPrice,
        maxPrice: rangeInputs.maxPrice,
        assumedPrice: rangeInputs.assumedPrice,
        fullRange: rangeInputs.fullRange,
      })

      setSelectedTokenIdx(newIdx)

      if (invertedPrices) {
        setRangeInputs((prev) => ({ ...prev, ...invertedPrices }))
      }
    },
    [rangeInputs],
  )

  // Event Management: Scroll to top on route entry
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Domain Logic: Price inversion and token symbol
  const tokenSymbols = [pool.token0.symbol, pool.token1.symbol]

  /**
   * Math: Resolve relative price
   * Uniswap price is usually token0/token1. If user selects token1 as base,
   * we may need to handle the reciprocal price depending on the calculator's logic.
   */
  const currentPrice =
    selectedTokenIdx === 0 ? pool.token0Price || 0 : pool.token1Price || 0

  // Stats: Derived metrics from historical snapshots
  const latestSnapshot = history[history.length - 1] || {}
  const poolAgeDays = pool?.createdAtTimestamp
    ? Math.floor(Date.now() / 1000 - pool.createdAtTimestamp) / 86400
    : 0

  // Calculate sample-based APY (7-day window)
  const last7Days = history.slice(-7)
  const avgAPY = calculateAverageAPY(last7Days, latestSnapshot.tvlUSD)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* NAVIGATION: Contextual return */}
      <Link to="/" className="btn btn-ghost btn-sm mb-6 gap-2">
        <span>←</span>
        <span>Back to Pools</span>
      </Link>

      {/* Header: Identity and protocol info */}
      <div className="bg-base-200 rounded-3xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {pool.token0.symbol} / {pool.token1.symbol}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge badge-primary badge-lg">
                {(pool.feeTier / 10000).toFixed(2)}% Fee
              </span>
              <span className="text-sm text-base-content/60">
                {pool.token0.name} / {pool.token1.name}
              </span>
            </div>
          </div>

          <div className="flex-gap-2">
            <a
              href={`https://etherscan.io/address/${pool.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm gap-2"
            >
              <span>View in explorer</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="TVL"
          value={formatCurrency(latestSnapshot.tvlUSD)}
          color="text-primary"
        />
        <StatCard
          label="Volume (24h)"
          value={formatCurrency(latestSnapshot.volumeUSD)}
          color="text-secondary"
        />
        <StatCard
          label="Avg APY (7d)"
          value={`${avgAPY.toFixed(2)}%`}
          color="text-success"
        />
        <StatCard
          label="Pool Age"
          value={`${Math.floor(poolAgeDays)} days`}
          color="text-info"
        />
      </div>

      {/* Main Interface: Simulator vs History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-base-200 rounded-3xl p-6 shadow-lg">
          <RangeCalculator
            pool={pool}
            selectedTokenIdx={selectedTokenIdx}
            inputs={rangeInputs}
            onInputsChange={setRangeInputs}
            hourlyData={hourlyData}
            isLoading={isLoading}
            fetchError={fetchError}
            ethPriceUSD={ethPriceUSD}
          />
        </div>
        <div className="bg-base-200 rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
          <div className="grid gap-4 mb-4">
            <TokenInfoBlock
              pool={pool}
              selectedTokenIdx={selectedTokenIdx}
              onTokenChange={handleTokenChange}
            />
          </div>
          <PoolCharts
            history={history}
            selectedTokenIdx={selectedTokenIdx}
            tokenSymbols={tokenSymbols}
            rangeInputs={rangeInputs}
            currentPrice={currentPrice}
          />
        </div>
      </div>
    </div>
  )
}

// ===== Helper Components =====

function StatCard({ label, value, color = 'text-base-content' }) {
  return (
    <div className="bg-base-200 rounded-2xl p-4 shadow">
      <div className="text-xs text-base-content/60 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

/**
 * Stats-optimized currency formatter (vs formatCompactCurrency in charts).
 * Precision: .toFixed(2) for KPI cards where extra decimal improves clarity.
 * Scope: Local to PoolDetail (if reused in 3+ components → refactor to utils).
 */
function formatCurrency(value) {
  if (!value || value === 0) return '$0'
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`

  return `$${value.toFixed(2)}`
}

function calculateAverageAPY(snapshots, currentTVL) {
  if (!snapshots || snapshots.length === 0 || !currentTVL) return 0

  const apyValues = snapshots
    .filter((s) => s.feesUSD && s.tvlUSD)
    .map((s) => {
      const dailyFeeRate = s.feesUSD / s.tvlUSD
      return dailyFeeRate * 365 * 100 // Annualized
    })

  if (apyValues.length === 0) return 0

  const sum = apyValues.reduce((acc, curr) => acc + curr, 0)
  return sum / apyValues.length
}
