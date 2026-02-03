/**
 * UI: Price Projection Controls (Dual-Token).
 * Allows independent future price input for token0 and token1 to simulate
 * asymmetric market movements (e.g. ETH +20%, USDC flat).
 *
 * Displays percentage change to help users gauge market move magnitude.
 * Formula: ((future - current) / current) * 100
 *
 * @param {Object} props
 * @param {string} props.token0Symbol
 * @param {string} props.token1Symbol
 * @param {number} props.currentToken0PriceUSD - Current market price (API source)
 * @param {number} props.currentToken1PriceUSD
 * @param {number} props.futureToken0PriceUSD - User-projected price
 * @param {number} props.futureToken1PriceUSD
 * @param {Function} props.onToken0PriceChange - Update handler for token0 projection
 * @param {Function} props.onToken1PriceChange - Update handler for token1 projection
 * @returns {JSX.Element}
 */
export function PriceInputSection({
  token0Symbol,
  token1Symbol,
  currentToken0PriceUSD,
  currentToken1PriceUSD,
  futureToken0PriceUSD,
  futureToken1PriceUSD,
  onToken0PriceChange,
  onToken1PriceChange,
}) {
  // Percentages Deviation: Convert absolute price delta to % for display
  const token0ChangePercent =
    currentToken0PriceUSD > 0
      ? (
          ((futureToken0PriceUSD - currentToken0PriceUSD) /
            currentToken0PriceUSD) *
          100
        ).toFixed(2)
      : '0.00'
  const token1ChangePercent =
    currentToken1PriceUSD > 0
      ? (
          ((futureToken1PriceUSD - currentToken1PriceUSD) /
            currentToken1PriceUSD) *
          100
        ).toFixed(2)
      : '0.00'

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Price: Token0 (Read-only, API-sourced) */}
      <div className="form-control">
        <label className="label">
          <span className="label-text mb-2 font-semibold">Current Price</span>
        </label>
        <div className="input input-bordered bg-base-300 flex items-center">
          <span className="text-base-content/60">$</span>
          <input
            type="number"
            value={currentToken0PriceUSD}
            disabled
            className="flex-1 bg-transparent"
            aria-label="Current Price"
          />
        </div>
        <label className="label">
          <span className="label-text-alt mt-2">
            {token0Symbol} Price (USD)
          </span>
        </label>
      </div>

      {/* Future Price: Token0 (User Projection) */}
      <div className="form-control">
        <label className="label">
          <span className="label mb-2 font-semibold">Future Price</span>
        </label>
        <div className="input input-bordered flex items-center">
          <span>$</span>
          <input
            type="number"
            value={futureToken0PriceUSD}
            onChange={(e) => onToken0PriceChange(e.target.value)}
            className="flex-1 bg-transparent"
            aria-label="Future Price"
          />
        </div>
        <label className="label">
          <span className="label-text-alt mt-2">{token0Symbol} Price</span>
          <span className="label-text-alt mt-2">
            ({token0ChangePercent >= 0 ? '+' : ''}
            {token0ChangePercent}%)
          </span>
        </label>
      </div>

      {/* Current Price: Token1 (Read-only, API-sourced) */}
      <div className="form-control">
        <div className="input input-bordered bg-base-300 flex items-center">
          <span className="text-base-content/60">$</span>
          <input
            type="number"
            value={currentToken1PriceUSD}
            disabled
            className="flex-1 bg-transparent"
            aria-label="Current Price"
          />
        </div>
        <label className="label">
          <span className="label-text-alt mt-2">
            {token1Symbol} Price (USD)
          </span>
        </label>
      </div>

      {/* Future Price: Token1 (User Projection) */}
      <div className="form-control">
        <div className="input input-bordered flex items-center">
          <span>$</span>
          <input
            type="number"
            value={futureToken1PriceUSD}
            onChange={(e) => onToken1PriceChange(e.target.value)}
            className="flex-1 bg-transparent"
            aria-label="Future Price"
          />
        </div>
        <label className="label">
          <span className="label-text-alt mt-2">{token1Symbol} Price</span>
          <span className="label-text-alt mt-2">
            ({token1ChangePercent >= 0 ? '+' : ''}
            {token1ChangePercent}%)
          </span>
        </label>
      </div>
    </div>
  )
}
