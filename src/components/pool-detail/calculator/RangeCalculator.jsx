import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { CalculatorStats } from "./CalculatorStats"
import { CalculatorInputs } from "./CalculatorInputs"
import { useDebounce } from "../../../hooks/useDebounce"
import { fetchPoolHourData } from "../../../services/theGraphClient"
import { simulateRangePerformance } from "./utils/simulateRangePerformance"
import { calculatePresetRange } from "./utils/calculatePresetRange"
import { calculateTokenPrices } from "./utils/calculateTokenPrices"
import { incrementPriceByTick } from "./utils/uniswapV3Ticks"
import { debugLog } from "../../../utils/logger"

/**
 * UI: Uniswap V3 Range Calculator Orchestrator
 * Manages state synchronization, price inversion on token flip, and fee simulation.
 * 
 * Architecture: Centralized state (inputs) lifted to PoolDetail parent for SSOT.
 * This component handles derived state (displayPrice, priceLabel) and effect coordination
 * 
 * @param {Object} props
 * @param {Object} props.pool - Pool data from TheGraph (token prices, metadata)
 * @param {number} props.selectedTokenIdx - Base token index (0 or 1, controls price inversion)
 * @param {Object} props.inputs - Centralized calculator state (capitalUSD, minPrice, maxPrice, assumedPrice, fullRange)
 * @param {Function} props.onInputsChange - State dispatcher for calculator inputs
 * @returns {JSX.Element}
 */
export function RangeCalculator({ pool, selectedTokenIdx, inputs, onInputsChange }) {
   const [hourlyData, setHourlyData] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [fetchError, setFetchError] = useState(null)

   // Flow Control: Prevents effect double-firing on token flip
   const prevTokenIdx = useRef(selectedTokenIdx)
   const hasPopulated = useRef(false)

   debugLog("Inputs:", inputs)

   // Derived State: Display price adapts to selected base token
   const displayPrice = useMemo(() => {
      if (!hourlyData) return 0

      const currentPrice = parseFloat(hourlyData[0].token0Price)

      return selectedTokenIdx === 0
         ? currentPrice          // Token0 per Token1
         : 1 / currentPrice      // Token1 per Token0 (reciprocal)
      }, [selectedTokenIdx, hourlyData])
   
   /**
    * Hydration: Initialize default ±10% range on first load.
    * Prevents empty state UI while providing sensible starting bounds.
    */
   useEffect(() => {
      if (!pool) return
      if (hasPopulated.current) return
      if (inputs.minPrice !== "" || inputs.maxPrice !== "") return
      if (!hourlyData) return
         
      const currentPrice = parseFloat(hourlyData[0].token0Price)
      const basePrice = selectedTokenIdx === 0
         ? currentPrice
         : 1 / currentPrice

      const minPrice = basePrice * 0.9
      const maxPrice = basePrice * 1.1
      const assumedPrice = displayPrice

      onInputsChange(prev => ({
         ...prev,
         minPrice,
         maxPrice,
         assumedPrice
      }))

      hasPopulated.current = true
   }, [
      inputs.minPrice, 
      inputs.maxPrice, 
      selectedTokenIdx, 
      hourlyData,
      onInputsChange,
      displayPrice,
      pool
   ])

   /**
    * Price Inversion Synchronization (Token Flip)
    * 
    * Mathematical Invariant: In Uniswap V3, price of A/B = 1 / (B/A).
    * When base token changes, we must:
    * 1. Invert all prices: P' = 1/P
    * 2. Swap min/max: (a < x < b) becomes (1/b < 1/x < 1/a)
    * 
    * Example: ETH/USDC [1500, 2000] → USDC/ETH [0.0005, 0.000667]
    * 
    */
   useEffect(() => {
      if (prevTokenIdx.current === selectedTokenIdx) {
         return
      }
      if (inputs.fullRange) {
         prevTokenIdx.current = selectedTokenIdx
         return
      }
      if (inputs.minPrice === "" || inputs.maxPrice === "") {
         prevTokenIdx.current = selectedTokenIdx
         return
      }
      
      const oldMin = Number(inputs.minPrice)
      const oldMax = Number(inputs.maxPrice)
      const oldAssumedPrice = Number(inputs.assumedPrice)

      // Validation: Skip if invalid state (prevents NaN propagation)
      if (
         oldMin <= 0 || 
         oldMax <= 0 || 
         oldAssumedPrice <= 0 ||
         !isFinite(oldMin) || 
         !isFinite(oldMax) ||
         !isFinite(oldAssumedPrice)
      ) 
         {
         prevTokenIdx.current = selectedTokenIdx
         return
      }

      // Invert and swap boundaries
      const newMin = 1 / oldMax
      const newMax = 1 / oldMin
      const newAssumedPrice = 1 / oldAssumedPrice

      onInputsChange(prev => ({
         ...prev,
         minPrice: newMin.toFixed(8), // Preserve precision for low-value assets
         maxPrice: newMax.toFixed(8),
         assumedPrice: newAssumedPrice
      }))

      prevTokenIdx.current = selectedTokenIdx
   }, [selectedTokenIdx, inputs.fullRange, inputs.minPrice, inputs.maxPrice, inputs.assumedPrice, onInputsChange])

   // Performance Optimization: Debounce by 500ms.
   // Prevents expensive simulateRangePerformance() recalculations on every keystroke.
   // Cost: ~50-100ms for 168 hourly data points (blocks render during computation).
   const debouncedInputs = useDebounce(inputs, 500)

   /**
    * Data Fetching: 7-Day Hourly Lookback.
    * Retrieves 168 data points for fee growth simulation.
    * 
    * Why 7 days? Balance between:
    * - Sample size (statistical significance)
    * - Recency (captures current market conditions)
    * Trade-off: Longer windows (30d) smooth outliers but miss regime changes.
    */
   useEffect(() => {
      let cancelled = false

      async function loadHourlyData() {
         try {
            const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
            const data = await fetchPoolHourData(pool.id, startTime)

            if (!cancelled) {
               setHourlyData(data)
               setIsLoading(false)
            }
         } catch (err) {
            console.error('❌ Fetch error:', err)
            if (!cancelled) {
               setFetchError(err.message)
               setIsLoading(false)
            }
         }
      }

      loadHourlyData()
      return () => { cancelled = true } // Cleanup: Prevents state update on unmounted component
   }, [pool.id])



   // Token Price Normalization: Convert pool prices to USD for display
   const { token0PriceUSD, token1PriceUSD } = useMemo(() => {
      const currentPrice = hourlyData?.[0]?.token0Price
         ? parseFloat(hourlyData[0].token0Price)
         : parseFloat(pool.token0Price)
      
      return calculateTokenPrices(pool, currentPrice)
   }, [hourlyData, pool])
      
   const priceLabel = useMemo(() => {
      return selectedTokenIdx === 0
         ? `${pool.token0.symbol} per ${pool.token1.symbol}`
         : `${pool.token1.symbol} per ${pool.token0.symbol}`
   }, [selectedTokenIdx, pool.token0.symbol, pool.token1.symbol])

   const handleInputChange = useCallback((field, value) => {
      onInputsChange(prev => ({ ...prev, [field]: value }))
   }, [onInputsChange])

   /**
    * Tick-Aligned Price Adjustment.
    * Uniswap V3 prices are discrete (quantized by fee tier).
    * This ensures manual adjustments land on valid tick boundaries.
    */
   const handleInputIncrement = useCallback((field, delta) => {
      const currentValue = Number(inputs[field])
      if (!currentValue || currentValue <= 0) return

      const newValue = incrementPriceByTick(currentValue, pool.feeTier, delta)
      onInputsChange(prev => ({ ...prev, [field]: newValue }))
   }, [inputs, pool.feeTier, onInputsChange])

   const handlePresetClick = useCallback((presetType) => {
      const assumedPrice = displayPrice
      const { minPrice, maxPrice } = calculatePresetRange(assumedPrice,presetType)
      onInputsChange(prev => ({...prev, minPrice, maxPrice}))
   }, [displayPrice, onInputsChange])

   /**
    * Fee Simulation Engine (Memoized).
    * Most CPU-intensive operation: iterates through 168 hourly snapshots,
    * calculates liquidity concentration, and projects fee accrual.
    * 
    * Runs only when debounced inputs or market data changes.
    * 
    */
   const results = useMemo(() => {
      if (!hourlyData) return null

      const assumedPrice = inputs.assumedPrice

      return simulateRangePerformance({
         capitalUSD: debouncedInputs.capitalUSD,
         minPrice: debouncedInputs.minPrice === "" ? null : Number(debouncedInputs.minPrice),
         maxPrice: debouncedInputs.maxPrice === "" ? null : Number(debouncedInputs.maxPrice),
         fullRange: debouncedInputs.fullRange,
         assumedPrice,
         selectedTokenIdx,
         hourlyData,
         pool
      })
   }, [debouncedInputs, selectedTokenIdx, hourlyData, pool, inputs.assumedPrice])

   return (
      <div className="grid gap-6">
         <div className="flex flex-col gap-6">
            <div className="card rounded-2xl bg-base-200">
               <CalculatorStats 
                  results={results}
                  isLoading={isLoading}
                  fetchError={fetchError}
                  poolData={pool}
                  rangeInputs={inputs}
                  token0PriceUSD={token0PriceUSD}
                  token1PriceUSD={token1PriceUSD}
               />
            </div>

            <div className="card rounded-2xl bg-base-200">
               <CalculatorInputs 
                  inputs={inputs}
                  onChange={handleInputChange}
                  onIncrement={handleInputIncrement}
                  onPresetClick={handlePresetClick}
                  currentPrice={displayPrice}
                  priceLabel={priceLabel}
                  token0Symbol={pool.token0.symbol}
                  token1Symbol={pool.token1.symbol}
                  token0PriceUSD={token0PriceUSD}
                  token1PriceUSD={token1PriceUSD}
                  composition={results?.composition || null}
               />
            </div>
         </div>
      </div>
   )
}
