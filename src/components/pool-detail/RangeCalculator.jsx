import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { CalculatorStats } from "./CalculatorStats"
import { CalculatorInputs } from "./CalculatorInputs"
import { useDebounce } from "../../hooks/useDebounce"
import { fetchPoolHourData } from "../../services/theGraphClient"
import { simulateRangePerformance } from "../../utils/simulateRangePerformance"
import { calculatePresetRange } from "../../utils/calculatePresetRange"
import { incrementPriceByTick } from "../../utils/uniswapV3Ticks"

export function RangeCalculator({ pool, selectedTokenIdx, inputs, onInputsChange }) {
   // === 1. STATE MANAGEMENT ===
   const [hourlyData, setHourlyData] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [fetchError, setFetchError] = useState(null)

   const prevTokenIdx = useRef(selectedTokenIdx)
   const hasPopulated = useRef(false)

   // 🔍 DIAGNOSTIC
   console.log("Inputs:", inputs)

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

            // 🔍 DIAGNOSTIC
            // console.log('🔍 Query params:', {
            //    poolId: pool.id,
            //    startTime,
            //    startDate: new Date(startTime * 1000).toISOString(),
            //    expectedSnapshots: 7 * 24 // 168
            // })

            // if (data?.length > 0) {
            //    const actualHours = (data[data.length - 1].periodStartUnix - data[0].periodStartUnix) / 3600
            //    console.log('📊 Coverage:', {
            //       snapshots: data.length,
            //       actualHours: Math.round(actualHours),
            //       completeness: (data.length / 168 * 100).toFixed(1) + '%'
            //    })
            // }

            // 🔍 DIAGNOSTIC
            // console.group('🔍 Hourly Data Diagnostic')
            // console.log('Pool ID:', pool.id)
            // console.log('Requested startTime:', new Date(startTime * 1000))
            // console.log('Data received:', data?.length || 0, 'snapshots')
            // if (data?.length > 0) {
            // console.log('First snapshot:', {
            //    time: new Date(data[0].periodStartUnix * 1000),
            //    token0Price: data[0].token0Price,
            //    liquidity: data[0].liquidity,
            //    feesUSD: data[0].feesUSD
            // })
            // console.log('Last snapshot:', {
            //    time: new Date(data[data.length - 1].periodStartUnix * 1000),
            //    token0Price: data[data.length - 1].token0Price
            // })
            // }
            // console.groupEnd()

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
      
      const tvlUSD = parseFloat(pool.totalValueLockedUSD)
      const tvl0 = parseFloat(pool.totalValueLockedToken0)
      const tvl1 = parseFloat(pool.totalValueLockedToken1)

      // 6.2 Basic validation
      if (tvlUSD <= 0 || tvl0 <= 0 || tvl1 <= 0 || currentPrice <= 0) {
         return { token0PriceUSD: 0, token1PriceUSD: 0 }
      }

      // 6.3 Try inference formula first
      let price1USD = tvlUSD / (tvl0 / currentPrice + tvl1)
      let price0USD = price1USD / currentPrice

      // 6.4 Validate inference result (sanity check)
      const inferenceIsValid =
         isFinite(price0USD) &&
         isFinite(price1USD) &&
         price0USD > 0 &&
         price1USD > 0 &&
         // Sanity: neither token should be > $1M (unless it's a whale token)
         price0USD < 1_000_000 &&
         price1USD < 1_000_000 &&
         // Sanity: TVL reconstruction should match (within 10% error)
         Math.abs((tvl0 * price0USD + tvl1 * price1USD) - tvlUSD) / tvlUSD < 0.1

      // 6.5 If inference failed, use stablecoin heuristic as fallback
      if (!inferenceIsValid) {
         const stableSymbols = ["USDT", "USDC", "DAI", "BUSD", "FRAX", "TUSD", "USDD"]
         const token0IsStable = stableSymbols.includes(pool.token0.symbol)
         const token1IsStable = stableSymbols.includes(pool.token1.symbol)

         if (token1IsStable) {
            // token1 is stablecoin → token1 = $1, derive token0
            price1USD = 1
            price0USD = currentPrice // currentPrice is "token1 per token0" = "USD per token0"
         } else if (token0IsStable) {
            // token0 is stablecoin → token0 = $1, derive token1
            price0USD = 1
            price1USD = 1 / currentPrice // invert to get USD per token1
         } else {
            // No stablecoin, inference failed → return 0 (will show "N/A")
            console.warn("Price inference failed and no stablecoin detected", {
               pool: pool.id,
               price0USD,
               price1USD,
               tvlUSD,
               currentPrice
            })
            return { token0PriceUSD: 0, token1PriceUSD: 0 }
         }
      }

      return { token0PriceUSD: price0USD, token1PriceUSD: price1USD }
   }, [hourlyData, pool.id, pool.token0Price, pool.token0.symbol, pool.token1.symbol, pool.totalValueLockedUSD, pool.totalValueLockedToken0, pool.totalValueLockedToken1])
      
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