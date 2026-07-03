import { useMemo, useCallback, SetStateAction } from 'react'
import { CalculatorStats } from './CalculatorStats'
import { CalculatorInputs } from './CalculatorInputs'
import { simulateRangePerformance } from './utils/simulateRangePerformance'
import { calculatePresetRange } from './utils/calculatePresetRange'
import { calculateTokenPrices } from './utils/calculateTokenPrices'
import { incrementPriceByTick } from './utils/uniswapV3Ticks'
import { buildUniswapPositionUrl } from '../../../utils/buildUniswapPositionUrl'
import { debugLog } from '../../../utils/logger'
import type { Dispatch, ReactNode } from 'react'
import type { Preset, Field, Value } from './CalculatorInputs'
import type { ProcessResult, ProcessSuccess } from './utils/simulateRangePerformance'
import type { RawPoolHourData, UserInputs, RawPoolHistory } from '../../../types'

interface RangeCalculatorProps {
  pool: RawPoolHistory
  selectedTokenIdx: number
  inputs: UserInputs
  hourlyData: RawPoolHourData[]
  isLoading: boolean
  fetchError: string | null
  ethPriceUSD: number
  onInputsChange: Dispatch<SetStateAction<UserInputs>>
}

/**
 * UI: Uniswap V3 Range Calculator Orchestrator
 * Manages state synchronization, price inversion on token flip, and fee simulation.
 *
 * Architecture: Centralized state (inputs) lifted to PoolDetail parent for SSOT.
 * This component handles derived state (displayPrice, priceLabel) and effect coordination
 *
 * @param props
 * @param props.pool - Pool data from TheGraph (token prices, metadata)
 * @param props.selectedTokenIdx - Base token index (0 or 1, controls price inversion)
 * @param props.inputs - Centralized calculator state (capitalUSD, minPrice, maxPrice, assumedPrice, fullRange)
 * @param props.onInputsChange - State dispatcher for calculator inputs
 */
export function RangeCalculator({
  pool,
  selectedTokenIdx,
  inputs,
  hourlyData,
  isLoading,
  fetchError,
  ethPriceUSD,
  onInputsChange
}: RangeCalculatorProps): ReactNode {
  debugLog('Inputs:', inputs)

  // Derived State: Display price adapts to selected base token
  const displayPrice = useMemo(() => {
    if (!pool) return 0

    const currentPrice = parseFloat(pool?.token0Price)

    return selectedTokenIdx === 0
      ? currentPrice // Token0 per Token1
      : 1 / currentPrice // Token1 per Token0 (reciprocal)
  }, [selectedTokenIdx, pool])

  // Token Price Normalization: Convert pool prices to USD for display
  const { token0PriceUSD, token1PriceUSD } = useMemo(() => {
    const currentPrice =
      parseFloat(pool?.token0Price) ||
      parseFloat(hourlyData?.[0]?.token0Price) ||
      0

    return calculateTokenPrices(
      pool.token0,
      pool.token1,
      ethPriceUSD,
      currentPrice
    )
  }, [hourlyData, pool, ethPriceUSD])

  const priceLabel = useMemo(() => {
    return selectedTokenIdx === 0
      ? `${pool.token0.symbol} per ${pool.token1.symbol}`
      : `${pool.token1.symbol} per ${pool.token0.symbol}`
  }, [selectedTokenIdx, pool.token0.symbol, pool.token1.symbol])

  const handleInputChange = useCallback(
    (field: Field, value: Value) => {
      onInputsChange((prev: UserInputs) => ({ ...prev, [field]: value }))
    },
    [onInputsChange]
  )

  /**
   * Tick-Aligned Price Adjustment.
   * Uniswap V3 prices are discrete (quantized by fee tier).
   * This ensures manual adjustments land on valid tick boundaries.
   */
  const handleInputIncrement = useCallback(
    (field: keyof UserInputs, delta: number) => {
      const currentValue = Number(inputs[field])
      if (!currentValue || currentValue <= 0) return

      const newValue = incrementPriceByTick(currentValue, Number(pool.feeTier), delta)
      onInputsChange((prev: UserInputs) => ({ ...prev, [field]: newValue }))
    },
    [inputs, pool.feeTier, onInputsChange]
  )

  const handlePresetClick = useCallback(
    (presetType: Preset) => {
      const assumedPrice = displayPrice
      const { minPrice, maxPrice } = calculatePresetRange(
        assumedPrice,
        presetType
      )
      onInputsChange((prev: UserInputs) => ({ ...prev, minPrice, maxPrice }))
    },
    [displayPrice, onInputsChange]
  )

  /**
   * Fee Simulation Engine (Memoized).
   * Iterates through 168 hourly snapshots to calculate liquidity concentration,
   * and project fee accrual. Runs in <30ms (negligible blocking time).
   *
   * Recalculates only whenever inputs or market data change.
   */
  const results = useMemo(() => {
    if (!hourlyData) return null

    const assumedPrice = Number(inputs.assumedPrice)

    return simulateRangePerformance({
      capitalUSD: inputs.capitalUSD,
      minPrice: Number(inputs.minPrice === '' ? null : Number(inputs.minPrice)),
      maxPrice: Number(inputs.maxPrice === '' ? null : Number(inputs.maxPrice)),
      fullRange: inputs.fullRange,
      assumedPrice,
      selectedTokenIdx,
      hourlyData,
      pool,
      ethPriceUSD
    })
  }, [inputs, selectedTokenIdx, hourlyData, pool, ethPriceUSD])

  const composition = results?.success ? (results as ProcessSuccess).composition : null
  const positionUrl = useMemo(
    () => buildUniswapPositionUrl(pool, inputs, selectedTokenIdx, composition ?? undefined),
    [pool, inputs, selectedTokenIdx, composition]
  )

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4">
        <div className="card glass-surface rounded-2xl p-4">
          <CalculatorStats
            results={results as ProcessResult}
            isLoading={isLoading}
            fetchError={fetchError}
            poolData={pool}
            rangeInputs={inputs}
            token0PriceUSD={token0PriceUSD}
            token1PriceUSD={token1PriceUSD}
          />
        </div>

        <div className="card glass-surface rounded-2xl p-4">
          <CalculatorInputs
            inputs={inputs}
            onChange={handleInputChange}
            onIncrement={handleInputIncrement}
            onPresetClick={handlePresetClick}
            currentPrice={displayPrice}
            priceLabel={priceLabel}
            token0Symbol={pool.token0.symbol}
            token1Symbol={pool.token1.symbol}
            positionUrl={positionUrl}
            composition={composition}
            selectedTokenIdx={selectedTokenIdx}
          />
        </div>
      </div>
    </div>
  )
}
