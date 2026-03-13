import { useLoaderData, Link } from 'react-router-dom'
import { useCallback, useEffect, useState, useRef } from 'react'
import { ContractLinks } from './ContractLinks'
import { CurrentPriceCard } from './CurrentPriceCard'
import { PoolCharts } from './charts/PoolCharts'
import { RangeCalculator } from './calculator/RangeCalculator'
import { invertPriceRange } from './calculator/utils/invertPriceRange'
import { usePoolHourlyData } from './calculator/hooks/usePoolHourlyData'

const DexScreenLogo = () => (
  <svg width="1.5em" height="1.5em" viewBox="0 0 252 300"
    fill="currentColor" fillRule="evenodd" xmlns="http://www.w3.org/2000/svg">
    <path d="M151.818 106.866c9.177-4.576 20.854-11.312 32.545-20.541 2.465 5.119 2.735 9.586 1.465 13.193-.9 2.542-2.596 4.753-4.826 6.512-2.415 1.901-5.431 3.285-8.765 4.033-6.326 1.425-13.712.593-20.419-3.197m1.591 46.886l12.148 7.017c-24.804 13.902-31.547 39.716-39.557 64.859-8.009-25.143-14.753-50.957-39.556-64.859l12.148-7.017a5.95 5.95 0 003.84-5.845c-1.113-23.547 5.245-33.96 13.821-40.498 3.076-2.342 6.434-3.518 9.747-3.518s6.671 1.176 9.748 3.518c8.576 6.538 14.934 16.951 13.821 40.498a5.95 5.95 0 003.84 5.845zM126 0c14.042.377 28.119 3.103 40.336 8.406 8.46 3.677 16.354 8.534 23.502 14.342 3.228 2.622 5.886 5.155 8.814 8.071 7.897.273 19.438-8.5 24.796-16.709-9.221 30.23-51.299 65.929-80.43 79.589-.012-.005-.02-.012-.029-.018-5.228-3.992-11.108-5.988-16.989-5.988s-11.76 1.996-16.988 5.988c-.009.005-.017.014-.029.018-29.132-13.66-71.209-49.359-80.43-79.589 5.357 8.209 16.898 16.982 24.795 16.709 2.929-2.915 5.587-5.449 8.814-8.071C69.31 16.94 77.204 12.083 85.664 8.406 97.882 3.103 111.959.377 126 0m-25.818 106.866c-9.176-4.576-20.854-11.312-32.544-20.541-2.465 5.119-2.735 9.586-1.466 13.193.901 2.542 2.597 4.753 4.826 6.512 2.416 1.901 5.432 3.285 8.766 4.033 6.326 1.425 13.711.593 20.418-3.197"></path>
    <path d="M197.167 75.016c6.436-6.495 12.107-13.684 16.667-20.099l2.316 4.359c7.456 14.917 11.33 29.774 11.33 46.494l-.016 26.532.14 13.754c.54 33.766 7.846 67.929 24.396 99.193l-34.627-27.922-24.501 39.759-25.74-24.231L126 299.604l-41.132-66.748-25.739 24.231-24.501-39.759L0 245.25c16.55-31.264 23.856-65.427 24.397-99.193l.14-13.754-.016-26.532c0-16.721 3.873-31.578 11.331-46.494l2.315-4.359c4.56 6.415 10.23 13.603 16.667 20.099l-2.01 4.175c-3.905 8.109-5.198 17.176-2.156 25.799 1.961 5.554 5.54 10.317 10.154 13.953 4.48 3.531 9.782 5.911 15.333 7.161 3.616.814 7.3 1.149 10.96 1.035-.854 4.841-1.227 9.862-1.251 14.978L53.2 160.984l25.206 14.129a41.926 41.926 0 015.734 3.869c20.781 18.658 33.275 73.855 41.861 100.816 8.587-26.961 21.08-82.158 41.862-100.816a41.865 41.865 0 015.734-3.869l25.206-14.129-32.665-18.866c-.024-5.116-.397-10.137-1.251-14.978 3.66.114 7.344-.221 10.96-1.035 5.551-1.25 10.854-3.63 15.333-7.161 4.613-3.636 8.193-8.399 10.153-13.953 3.043-8.623 1.749-17.689-2.155-25.799l-2.01-4.175z"></path>
  </svg>
)

const BlockExplorerIcon = () => (
  <svg width="1.5em" height="1.5em" viewBox="0 0 24 24"
    fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M12 22c.244 0 .471-.113.926-.34l3.65-1.817C18.193 19.04 19 18.637 19 18v-8m-7 12c-.244 0-.471-.113-.926-.34l-3.65-1.817C5.807 19.04 5 18.637 5 18v-8m7 12v-8m7-4c0-.637-.808-1.039-2.423-1.843l-3.651-1.818C12.47 6.113 12.244 6 12 6s-.471.113-.926.34l-3.65 1.817C5.807 8.96 5 9.363 5 10m14 0c0 .637-.808 1.039-2.423 1.843l-3.651 1.818c-.455.226-.682.339-.926.339m-7-4c0 .637.808 1.039 2.423 1.843l3.651 1.818c.455.226.682.339.926.339"/>
      <path strokeLinecap="round" d="m22 21l-3-2.5M12 2v4M2 21l3-2.5"/>
    </g>
  </svg>
)

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
    assumedPrice: ''
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

    const currentPrice = selectedTokenIdx === 0 ? pool.token0Price || 0 : pool.token1Price || 0

    setRangeInputs((prev) => ({
      ...prev,
      minPrice: currentPrice * 0.9,
      maxPrice: currentPrice * 1.1,
      assumedPrice: currentPrice
    }))

    hasHydrated.current = true

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourlyData, selectedTokenIdx, pool.token0Price, pool.token1Price])
  // Justification: rangeInputs.minPrice/maxPrice are guards, not triggers.
  // Including them would cause unnecessary effect re-runs on every input change.

  const handleTokenChange = useCallback(
    (newIdx) => {
      const invertedPrices = invertPriceRange({
        minPrice: rangeInputs.minPrice,
        maxPrice: rangeInputs.maxPrice,
        assumedPrice: rangeInputs.assumedPrice,
        fullRange: rangeInputs.fullRange
      })

      setSelectedTokenIdx(newIdx)

      if (invertedPrices) {
        setRangeInputs((prev) => ({ ...prev, ...invertedPrices }))
      }
    },
    [rangeInputs]
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
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">

          <div>
            {/* Row 1: name + fee only */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">
                {pool.token0.symbol} / {pool.token1.symbol}
              </h1>
              <span className="badge badge-outline text-primary badge-md">
                {(pool.feeTier / 10000).toFixed(2)}%
              </span>
              <span className="badge badge-soft badge-md text-base-content/60 hidden md:inline-flex">
                Ethereum
              </span>
            </div>

            {/* Row 2: full token names */}
            <span className="text-sm text-base-content/60">
              {pool.token0.name} / {pool.token1.name}
            </span>
          </div>

          {/* Row 3: chain badge - mobile only */}
          <span className="badge badge-soft badge-md text-base-content/60 md:hidden mt-1">
            Ethereum
          </span>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-end gap-2">
            <span className="text-sm text-base-content/60">
              {Math.floor(poolAgeDays)} days old
            </span>
            <div className="flex justify-around md:justify-between">
              <div className="tooltip" data-tip="View on DexScreener">
                <a
                  href={`https://dexscreener.com/ethereum/${pool.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn btn-ghost btn-sm">
                    <DexScreenLogo />
                  </button>
                </a>
              </div>

              <div className="tooltip" data-tip="View on Explorer">
                <a
                  href={`https://etherscan.io/address/${pool.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn btn-ghost btn-sm">
                    <BlockExplorerIcon />
                  </button>
                </a>
              </div>
            </div>
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
          <CurrentPriceCard
            pool={pool}
            selectedTokenIdx={selectedTokenIdx}
            onTokenChange={handleTokenChange}
          />
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
          <ContractLinks
            pool={pool}
          />
        </div>
        <div className="bg-base-200 rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
          <PoolCharts
            pool={pool}
            history={history}
            hourlyData={hourlyData}
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
