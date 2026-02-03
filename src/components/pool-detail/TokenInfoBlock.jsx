import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#605dff', '#01d390']

/**
 * UI: Token Composition Analyzer
 *
 * Architecture: Extracted from PoolDetail to isolate TVL distribution logic
 * and enable reuse in watchlist comparisons (future feature).
 *
 * Design Decision: PieChart over stacked bars for instant visual ratio recognition
 * (critical for risk assessment: 90/10 splits indicate impermanent loss risk).
 *
 * @param {Object} props
 * @param {Object} props.pool - Pool entity with token metadata and TVL snapshots
 * @param {number} props.selectedTokenIdx - Active token for price display (0 or 1)
 * @param {Function} props.onTokenChange - Callback to sync PriceChart toggle state
 * @returns {JSX.Element}
 */
export function TokenInfoBlock({ pool, selectedTokenIdx, onTokenChange }) {
  const pieData = useMemo(() => {
    const tvl0 = parseFloat(pool.totalValueLockedToken0)
    const tvl1 = parseFloat(pool.totalValueLockedToken1)

    if (tvl0 === 0 && tvl1 === 0) {
      return []
    }

    return [
      { name: pool.token0.symbol, value: tvl0 },
      { name: pool.token1.symbol, value: tvl1 },
    ]
  }, [
    pool.totalValueLockedToken0,
    pool.totalValueLockedToken1,
    pool.token0.symbol,
    pool.token1.symbol,
  ])

  const totalValue = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0)
  }, [pieData])

  // Trade-off: useMemo for price instead of inline calculation
  // Prevents re-computation on unrelated state changes (e.g. scroll position)
  const currentPrice = useMemo(() => {
    const price0 = parseFloat(pool.token0Price)
    const price1 = parseFloat(pool.token1Price)

    if (isNaN(price0) || isNaN(price1)) return null

    return selectedTokenIdx === 0 ? price0 : price1
  }, [pool.token0Price, pool.token1Price, selectedTokenIdx])

  const truncateAddress = (address) => {
    if (!address || address.length < 10) return 'N/A'
    return address.slice(0, 6) + '...' + address.slice(-4)
  }

  function TokenLink({ token }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{token.symbol}</span>
        <a
          href={`https://etherscan.io/address/${token.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {truncateAddress(token.id)}
          <span className="ml-1">↗</span>
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-base-200 mb-4">
      {currentPrice && (
        <div className="mb-3 p-3 rounded-lg bg-base-300">
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
          onClick={() => onTokenChange(0)}
        >
          {pool.token0.symbol}
        </button>
        <button
          className={`btn join-item ${selectedTokenIdx === 1 ? 'btn-active' : ''}`}
          onClick={() => onTokenChange(1)}
        >
          {pool.token1.symbol}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <TokenLink token={pool.token0} />
        <TokenLink token={pool.token1} />
      </div>

      {pieData.length > 0 && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={(entry) => {
                  const percent = ((entry.value / totalValue) * 100).toFixed(1)
                  return `${entry.name} - ${percent}%`
                }}
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} // Modulo to avoid out-of-bounds
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
