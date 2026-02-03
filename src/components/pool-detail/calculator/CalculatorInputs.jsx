/**
 * UI: LP Position Parameter Controls.
 * Manages capital allocation, price range boundaries (tick-aligned), and token composition.
 *
 * Architecture: Composition data flows from simulateRangePerformance hook.
 * While simulation runs, shows "--" placeholders until composition data arrives.
 *
 * @param {Object} props
 * @param {Object} props.inputs - Calculator state (capitalUSD, minPrice, maxPrice, assumedPrice, fullRange)
 * @param {Function} props.onChange - State dispatcher for user inputs
 * @param {Function} props.onIncrement - Tick-aligned price adjustment (±1 tick spacing based on fee tier)
 * @param {Function} props.onPresetClick - Applies volatility presets ("±10%", "±15%", "±20%")
 * @param {string} props.priceLabel - Display format (e.g. "USDC per ETH")
 * @param {string} props.token0Symbol - Token0 display name (e.g. "ETH")
 * @param {string} props.token1Symbol - Token1 display name (e.g. "USDC")
 * @param {Object} [props.composition] - Calculated token split from simulation hook (null during computation)
 * @returns {JSX.Element}
 */
export function CalculatorInputs({
  inputs,
  onChange,
  onIncrement,
  onPresetClick,
  priceLabel,
  token0Symbol,
  token1Symbol,
  composition,
}) {
  const token0Amount = composition?.amount0
  const token1Amount = composition?.amount1
  const capital0 = composition?.capital0USD
  const capital1 = composition?.capital1USD

  return (
    <div>
      {/* Capital Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Deposit Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={inputs.capitalUSD}
            onChange={(e) => onChange('capitalUSD', Number(e.target.value))}
            className="input input-xl w-full pl-10 text-3xl font-bold bg-base-300"
            min="0"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-base-content/60">
            $
          </span>
        </div>

        {/* Token Distribution Display */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {token0Symbol}:
            </span>
            <span>
              {token0Amount > 0 ? token0Amount.toFixed(6) : '--'}
              <span className="text-base-content/60 ml-2">
                ${capital0?.toFixed(2) ?? '--'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              {token1Symbol}:
            </span>
            <span>
              {token1Amount > 0 ? token1Amount.toFixed(6) : '--'}
              <span className="text-base-content/60 ml-2">
                ${capital1?.toFixed(2) ?? '--'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Price Range Configuration */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold">Price Range</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">Full Range:</span>
            <input
              type="checkbox"
              checked={inputs.fullRange}
              onChange={(e) => onChange('fullRange', e.target.checked)}
              className="toggle toggle-sm"
            />
          </label>
        </div>

        {/* Volatility Presets
                Disabled when fullRange=true (liquidity spans 0 to ∞, no discrete bounds) */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => onPresetClick('±10%')}
            className="btn btn-sm btn-outline flex-1"
            disabled={inputs.fullRange}
          >
            ±10%
          </button>
          <button
            type="button"
            onClick={() => onPresetClick('±15%')}
            className="btn btn-sm btn-outline flex-1"
            disabled={inputs.fullRange}
          >
            ±15%
          </button>
          <button
            type="button"
            onClick={() => onPresetClick('±20%')}
            className="btn btn-sm btn-outline flex-1"
            disabled={inputs.fullRange}
          >
            ±20%
          </button>
        </div>

        {/* Min/Max Price Boundaries with Tick Adjustment */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-control bg-base-300 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-base-content/60">Min Price</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onIncrement('minPrice', -1)}
                  disabled={inputs.fullRange}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Decrease by 1 tick spacing"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onIncrement('minPrice', 1)}
                  disabled={inputs.fullRange}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Increase by 1 tick spacing"
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="number"
              value={inputs.fullRange ? '' : inputs.minPrice}
              onChange={(e) => onChange('minPrice', e.target.value)}
              disabled={inputs.fullRange}
              placeholder="0"
              className="input input-md w-full text-lg text-center bg-base-300"
              step="0.0001"
            />

            <p className="text-xs text-center text-base-content/50 mt-2">
              {priceLabel}
            </p>
          </div>

          <div className="form-control bg-base-300 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-base-content/60">Max Price</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onIncrement('maxPrice', -1)}
                  disabled={inputs.fullRange}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Decrease by 1 tick spacing"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => onIncrement('maxPrice', 1)}
                  disabled={inputs.fullRange}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Increase by 1 tick spacing"
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="number"
              value={inputs.fullRange ? '' : inputs.maxPrice}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              disabled={inputs.fullRange}
              placeholder="∞"
              className="input input-md w-full text-lg text-center bg-base-300"
              step="0.0001"
            />

            <p className="text-xs text-center text-base-content/50 mt-2">
              {priceLabel}
            </p>
          </div>
        </div>

        {/* Assumed Entry Price for Simulation */}
        <div className="bg-base-300 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2 gap-2">
            <div className="flex items-center">
              <span className="text-xs text-base-content/60 pr-2">
                Assumed Entry Price
              </span>
              <button className="btn btn-circle btn-xs">
                <div
                  className="tooltip tooltip-right"
                  data-tip="It first populates with the most recent price for the pool. You can adjust your desired entry price for the range calculator."
                >
                  <div className="font-medium text-base-content max-w-[120px] truncate">
                    ?
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onIncrement('assumedPrice', -1)}
                className="btn btn-xs btn-circle btn-ghost"
                title="Decrease by 1 tick spacing"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => onIncrement('assumedPrice', 1)}
                className="btn btn-xs btn-circle btn-ghost"
                title="Increase by 1 tick spacing"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="number"
            value={inputs.fullRange ? '' : inputs.assumedPrice}
            onChange={(e) => onChange('assumedPrice', Number(e.target.value))}
            disabled={inputs.fullRange}
            placeholder={inputs.fullRange ? '50/50 split' : ''}
            className="input input-md w-full text-lg text-center bg-base-300"
          />

          <p className="text-xs text-center text-base-content/50 mt-2">
            {priceLabel}
          </p>
        </div>
      </div>

      {/* Protocol deep-link */}
      <button className="btn btn-primary w-full">
        Create Position on Uniswap →
      </button>
    </div>
  )
}
