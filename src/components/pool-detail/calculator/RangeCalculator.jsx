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

export function RangeCalculator({ pool, selectedTokenIdx, inputs, onInputsChange }) {
   // === 1. STATE MANAGEMENT ===
   const [hourlyData, setHourlyData] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [fetchError, setFetchError] = useState(null)

   const prevTokenIdx = useRef(selectedTokenIdx)
   const hasPopulated = useRef(false)

   // 🔍 DIAGNOSTIC
   debugLog("Inputs:", inputs)

   // === 2. DISPLAY ===
   const displayPrice = useMemo(() => {
      const price = selectedTokenIdx === 0
         ? Number(pool.token0Price)
         : Number(pool.token1Price)
      
         return price
      }, [selectedTokenIdx, pool.token0Price, pool.token1Price])
   
   // === 3. Auto-populate inputs on mount ±10% range ===
   useEffect(() => {
      if (!pool) return
      if (hasPopulated.current) return
      if (inputs.minPrice !== null || inputs.maxPrice !== null) return

      const basePrice = selectedTokenIdx === 0
         ? pool.token0Price
         : 1 / pool.token0Price

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
   }, [inputs.minPrice, inputs.maxPrice, selectedTokenIdx, pool.token0Price, onInputsChange, displayPrice, pool])

   // === 3.1 AUTO-CONVERT INPUTS ON TOKEN FLIP ===
   useEffect(() => {
      // Skip first render (no conversion needed)
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

      // Validate before conversion
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

      // Invert AND swap (min becomes max and vice versa)
      const newMin = 1 / oldMax
      const newMax = 1 / oldMin
      const newAssumedPrice = 1 / oldAssumedPrice

      onInputsChange(prev => ({
         ...prev,
         minPrice: newMin.toFixed(8), // Preserve precision
         maxPrice: newMax.toFixed(8),
         assumedPrice: newAssumedPrice
      }))

      prevTokenIdx.current = selectedTokenIdx
   }, [selectedTokenIdx, inputs.fullRange, inputs.minPrice, inputs.maxPrice, inputs.assumedPrice, onInputsChange])

   // === 4. DEBOUNCING ===
   const debouncedInputs = useDebounce(inputs, 500)

   // === 5. DATA FETCHING ===
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
      return () => { cancelled = true }
   }, [pool.id])



   // === 6. PRICE CALCULATIONS (DEFENSIVE) ===
   // 6.1 Get current price (prefer hourly data)
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

   // === 7. EVENT HANDLERS ===
   const handleInputChange = useCallback((field, value) => {
      onInputsChange(prev => ({ ...prev, [field]: value }))
   }, [onInputsChange])

   // Increment/decrement using Uniswap V3 tick spacing
   const handleInputIncrement = useCallback((field, delta) => {
      const currentValue = Number(inputs[field])
      if (!currentValue || currentValue <= 0) return

      // Calculate new price using tick math
      const newValue = incrementPriceByTick(currentValue, pool.feeTier, delta)
      onInputsChange(prev => ({ ...prev, [field]: newValue }))
   }, [inputs, pool.feeTier, onInputsChange])

   const handlePresetClick = useCallback((presetType) => {
      const assumedPrice = displayPrice
      const { minPrice, maxPrice } = calculatePresetRange(
         assumedPrice,
         presetType
      )
      onInputsChange(prev => ({
         ...prev,
         minPrice,
         maxPrice
      }))
   }, [displayPrice, onInputsChange])

   // === 8. RESULTS (MEMOIZED) ===
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
         {/* Left Column: Stats + Inputs */}
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