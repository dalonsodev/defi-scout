import type { ReactNode } from 'react'
import type { UserInputs } from '../../../types'
import type { PositionComposition } from './utils/simulateRangePerformance'
import { formatPriceInput, getPriceStep } from '../../../utils/priceInputUtils'

export type Field = 'capitalUSD' | 'fullRange' | 'minPrice' | 'maxPrice' | 'assumedPrice'
export type Value = number | boolean
export type Preset = '±10%' | '±15%' | '±20%'

interface CalculatorInputsProps {
  inputs: UserInputs
  onChange: (field: Field, value: Value) => void
  onIncrement: (field: keyof UserInputs, delta: number) => void
  onPresetClick: (preset: Preset) => void
  currentPrice: number
  priceLabel: string
  token0Symbol: string
  token1Symbol: string
  composition: PositionComposition | null
  selectedTokenIdx: number
  positionUrl: string
}

/**
 * UI: LP Position Parameter Controls.
 * Manages capital allocation, price range boundaries (tick-aligned), and token composition.
 *
 * Architecture: Composition data flows from simulateRangePerformance hook.
 * While simulation runs, shows "--" placeholders until composition data arrives.
 *
 * @param props
 * @param props.inputs - Calculator state (capitalUSD, minPrice, maxPrice, assumedPrice, fullRange)
 * @param props.onChange - State dispatcher for user inputs
 * @param props.onIncrement - Tick-aligned price adjustment (±1 tick spacing based on fee tier)
 * @param props.onPresetClick - Applies volatility presets ("±10%", "±15%", "±20%")
 * @param props.priceLabel - Display format (e.g. "USDC per ETH")
 * @param props.token0Symbol - Token0 display name (e.g. "ETH")
 * @param props.token1Symbol - Token1 display name (e.g. "USDC")
 * @param [props.composition] - Calculated token split from simulation hook (null during computation)
 * @param selectedTokenIdx - Index of token used for base price (0 or 1)
 * @param positionUrl - Used for deep-linking to automatically create the position on Uniswap
 *
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
  selectedTokenIdx,
  positionUrl
}: CalculatorInputsProps): ReactNode {
  const token0Amount = composition?.amount0 ?? 0
  const token1Amount = composition?.amount1 ?? 0
  const capital0 = composition?.capital0USD
  const capital1 = composition?.capital1USD

  const primary =
    selectedTokenIdx === 0
      ? { symbol: token0Symbol, amount: token0Amount, capital: capital0 }
      : { symbol: token1Symbol, amount: token1Amount, capital: capital1 }

  const secondary =
    selectedTokenIdx === 0
      ? { symbol: token1Symbol, amount: token1Amount, capital: capital1 }
      : { symbol: token0Symbol, amount: token0Amount, capital: capital0 }

  return (
    <div>
      {/* Capital Input */}
      <div className="mb-6">
        <label
          htmlFor="deposit-amount"
          className="mb-2 block text-sm font-semibold"
        >
          Deposit Amount
        </label>
        <div className="relative">
          <input
            type="number"
            id="deposit-amount"
            value={inputs.capitalUSD}
            onChange={(e) => onChange('capitalUSD', Number(e.target.value))}
            className="input input-xl glass-input w-full rounded-xl pl-10 text-3xl font-bold"
            min="0"
          />
          <span className="text-base-content/60 absolute top-1/2 left-4 -translate-y-1/2 text-3xl">
            $
          </span>
        </div>

        {/* Token Distribution Display */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="bg-primary h-2 w-2 rounded-full"></span>
              {primary.symbol}
              {composition && (
                <span className="text-base-content/60">
                  ({composition.token0Percent.toFixed(1)}%)
                </span>
              )}
            </span>
            <span>
              {primary.amount > 0 ? primary.amount.toFixed(6) : '--'}
              <span className="text-base-content/60 ml-2">
                ${primary.capital?.toFixed(2) ?? '--'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="bg-secondary h-2 w-2 rounded-full"></span>
              {secondary.symbol}
              {composition && (
                <span className="text-base-content/60">
                  ({composition.token1Percent.toFixed(1)}%)
                </span>
              )}
            </span>
            <span>
              {secondary.amount > 0 ? secondary.amount.toFixed(6) : '--'}
              <span className="text-base-content/60 ml-2">
                ${secondary.capital?.toFixed(2) ?? '--'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Price Range Configuration */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between md:mb-4">
          <label className="text-sm font-semibold">Price Range</label>
          <label className="flex cursor-pointer items-center gap-2">
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
        <div className="mb-3 flex gap-2 md:mb-6">
          <button
            type="button"
            onClick={() => onPresetClick('±10%')}
            className="btn btn-sm btn-glass flex-1 rounded-xl"
            disabled={inputs.fullRange}
          >
            ±10%
          </button>
          <button
            type="button"
            onClick={() => onPresetClick('±15%')}
            className="btn btn-sm btn-glass flex-1 rounded-xl"
            disabled={inputs.fullRange}
          >
            ±15%
          </button>
          <button
            type="button"
            onClick={() => onPresetClick('±20%')}
            className="btn btn-sm btn-glass flex-1 rounded-xl"
            disabled={inputs.fullRange}
          >
            ±20%
          </button>
        </div>

        {/* Min/Max Price Boundaries with Tick Adjustment */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="form-control glass-surface rounded-xl p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="mb-1 flex flex-1 items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onIncrement('minPrice', -1)}
                  disabled={inputs.fullRange}
                  className="btn btn-sm md:btn-xs btn-circle btn-glass"
                  title="Decrease by 1 tick spacing"
                >
                  −
                </button>
                <label className="text-base-content/60 text-xs">Min Price</label>
                <button
                  type="button"
                  onClick={() => onIncrement('minPrice', 1)}
                  disabled={inputs.fullRange}
                  className="btn btn-sm md:btn-xs btn-circle btn-glass"
                  title="Increase by 1 tick spacing"
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="number"
              value={inputs.fullRange ? '' : formatPriceInput(inputs.minPrice)}
              onChange={(e) => onChange('minPrice', Number(e.target.value))}
              disabled={inputs.fullRange}
              placeholder="0"
              className="input input-md glass-input w-full rounded-xl text-center text-lg"
              step={getPriceStep(inputs.minPrice)}
            />

            <p className="text-base-content/60 mt-2 text-center text-xs">{priceLabel}</p>
          </div>

          <div className="form-control glass-surface rounded-xl p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="mb-1 flex flex-1 items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onIncrement('maxPrice', -1)}
                  disabled={inputs.fullRange}
                  className="btn btn-sm md:btn-xs btn-circle btn-glass"
                  title="Decrease by 1 tick spacing"
                >
                  −
                </button>
                <label className="text-base-content/60 text-xs">Max Price</label>
                <button
                  type="button"
                  onClick={() => onIncrement('maxPrice', 1)}
                  disabled={inputs.fullRange}
                  className="btn btn-sm md:btn-xs btn-circle btn-glass"
                  title="Increase by 1 tick spacing"
                >
                  +
                </button>
              </div>
            </div>

            <input
              type="number"
              value={inputs.fullRange ? '' : formatPriceInput(inputs.maxPrice)}
              onChange={(e) => onChange('maxPrice', Number(e.target.value))}
              disabled={inputs.fullRange}
              placeholder="∞"
              className="input input-md glass-input w-full rounded-xl text-center text-lg"
              step={getPriceStep(inputs.maxPrice)}
            />

            <p className="text-base-content/60 mt-2 text-center text-xs">{priceLabel}</p>
          </div>
        </div>

        {/* Assumed Entry Price for Simulation */}
        <div className="glass-surface rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => onIncrement('assumedPrice', -1)}
                className="btn btn-sm md:btn-xs btn-circle btn-glass"
                title="Decrease by 1 tick spacing"
              >
                −
              </button>

              <div className="flex flex-1 items-center justify-center gap-1">
                <label
                  htmlFor="assumed-entry-price"
                  className="text-base-content/60 pr-1 text-xs"
                >
                  Assumed Entry Price
                </label>
                <button className="btn btn-circle btn-glass btn-xs">
                  <div
                    className="tooltip tooltip-top before:max-w-60 before:whitespace-normal"
                    data-tip="It first populates with the most recent price for the pool. You can adjust your desired entry price for the range calculator."
                  >
                    <div className="text-base-content max-w-[120px] truncate font-medium">?</div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onIncrement('assumedPrice', 1)}
                className="btn btn-sm md:btn-xs btn-circle btn-glass"
                title="Increase by 1 tick spacing"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="number"
            id="assumed-entry-price"
            value={inputs.fullRange ? '' : formatPriceInput(inputs.assumedPrice)}
            onChange={(e) => onChange('assumedPrice', Number(e.target.value))}
            disabled={inputs.fullRange}
            placeholder={inputs.fullRange ? '50/50 split' : ''}
            className="input input-md glass-input w-full rounded-xl text-center text-lg"
            step={getPriceStep(inputs.assumedPrice)}
          />

          <p className="text-base-content/60 mt-2 text-center text-xs">{priceLabel}</p>
        </div>
      </div>

      {/* Protocol deep-link */}
      <a
        href={positionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-error text-base-content w-full rounded-xl"
      >
        Create Position on Uniswap
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.25em"
          height="1.25em"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.6"
            d="M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6m-7 1l9-9m-5 0h5v5"
          />
        </svg>
      </a>
    </div>
  )
}
