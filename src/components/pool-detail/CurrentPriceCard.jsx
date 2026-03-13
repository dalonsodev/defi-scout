import { useMemo } from 'react'

/**
 * UI: Current Price Card
 *
 * @param {Object} props
 * @param {Object} props.pool - Pool entity with token metadata and TVL snapshots
 * @param {number} props.selectedTokenIdx - Active token for price display (0 or 1)
 * @param {Function} props.onTokenChange - Callback to sync PoolCharts toggle state
 * @returns {JSX.Element}
 */
export function CurrentPriceCard({ pool, selectedTokenIdx, onTokenChange }) {
  const currentPrice = useMemo(() => {
    const price0 = parseFloat(pool.token0Price)
    const price1 = parseFloat(pool.token1Price)

    if (isNaN(price0) || isNaN(price1)) return null

    return selectedTokenIdx === 0 ? price0 : price1
  }, [pool.token0Price, pool.token1Price, selectedTokenIdx])

  return (
    <div className="rounded-2xl bg-base-200 p-4">
      {currentPrice && (
        <div className="bg-base-300 rounded-lg p-3">
          <div className="text-xs text-base-content/60 mb-1">Current Price</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {currentPrice.toFixed(currentPrice < 1 ? 8 : 2)}
            </span>
            <span className="text-base text-base-content/70">
              {selectedTokenIdx === 0 ? pool.token0.symbol : pool.token1.symbol}
            </span>
            <span className="text-xs text-base-content/50">
              per{' '}
              {selectedTokenIdx === 0 ? pool.token1.symbol : pool.token0.symbol}
            </span>
          </div>
        </div>
      )}

      <div className="join">
        <button
          className={`btn join-item ${selectedTokenIdx === 0 ? 'btn-active' : ''}`}
          onClick={() => {onTokenChange(0)}}
        >
          {pool.token0.symbol}
        </button>
        <button
          className={`btn join-item ${selectedTokenIdx === 1 ? 'btn-active' : ''}`}
          onClick={() => {onTokenChange(1)}}
        >
          {pool.token1.symbol}
        </button>
      </div>
    </div>
  )
}
