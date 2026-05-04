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

    if (Number.isNaN(price0) || Number.isNaN(price1)) return null

    return selectedTokenIdx === 0 ? price0 : price1
  }, [pool.token0Price, pool.token1Price, selectedTokenIdx])

  const glassBtnClasses = 'btn btn-glass join-item'

  return (
    <div className="glass-surface rounded-2xl p-4">
      {currentPrice && (
        <div className="glass-surface rounded-lg p-3">
          <div className="text-base-content/60 mb-1 text-xs">Current Price</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {currentPrice.toFixed(currentPrice < 1 ? 8 : 2)}
            </span>
            <span className="text-base-content/70 text-base">
              {selectedTokenIdx === 0 ? pool.token0.symbol : pool.token1.symbol}
            </span>
            <span className="text-base-content/60 text-xs">
              per{' '}
              {selectedTokenIdx === 0 ? pool.token1.symbol : pool.token0.symbol}
            </span>
          </div>
        </div>
      )}

      <div className="join mt-4">
        <button
          className={`${glassBtnClasses} rounded-l-xl ${selectedTokenIdx === 0 ? 'btn-active' : ''}`}
          onClick={() => {
            onTokenChange(0)
          }}
        >
          {pool.token0.symbol}
        </button>
        <button
          className={`${glassBtnClasses} rounded-r-xl ${selectedTokenIdx === 1 ? 'btn-active' : ''}`}
          onClick={() => {
            onTokenChange(1)
          }}
        >
          {pool.token1.symbol}
        </button>
      </div>
    </div>
  )
}
