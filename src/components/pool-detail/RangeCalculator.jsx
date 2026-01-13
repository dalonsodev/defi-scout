import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { CalculatorStats } from "./CalculatorStats"
import { CalculatorInputs } from "./CalculatorInputs"
import { useDebounce } from "../../hooks/useDebounce"
import { simulateRangePerformance } from "../../utils/simulateRangePerformance"
import { fetchPoolHourData } from "../../services/theGraphClient"

export function RangeCalculator({ pool, selectedTokenIdx }) {
   // === 1. STATE MANAGEMENT ===
   const [inputs, setInputs] = useState({
      capitalUSD: 1000,
      minPrice: "",
      maxPrice: "",
      fullRange: false
   })
   const [hourlyData, setHourlyData] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [fetchError, setFetchError] = useState(null)

   // === 1.5. AUTO-CONVERT INPUTS ON TOKEN FLIP ===
   const prevTokenIdx = useRef(selectedTokenIdx)

   useEffect(() => {
      // Skip first render (no conversion needed)
      if (prevTokenIdx.current === selectedTokenIdx) {
         return
      }
      // Skip if fullRange (no inputs to convert)
      if (inputs.fullRange) {
         prevTokenIdx.current = selectedTokenIdx
         return
      }
      // Skip if inputs are empty
      if (inputs.minPrice === "" || inputs.maxPrice === "") {
         prevTokenIdx.current = selectedTokenIdx
         return
      }
      
      // Convert existing inputs to new scale
      const oldMin = Number(inputs.minPrice)
      const oldMax = Number(inputs.maxPrice)

      // Validate before conversion
      if (oldMin <= 0 || oldMax <= 0 || !isFinite(oldMin) || !isFinite(oldMax)) {
         prevTokenIdx.current = selectedTokenIdx
         return
      }

      // Invert AND swap (min becomes max and vice versa)
      const newMin = 1 / oldMax
      const newMax = 1 / oldMin

      setInputs(prev => ({
         ...prev,
         minPrice: newMin.toFixed(8), // Preserve precision
         maxPrice: newMax.toFixed(8)
      }))

      prevTokenIdx.current = selectedTokenIdx
   }, [selectedTokenIdx, inputs.fullRange, inputs.minPrice, inputs.maxPrice])

   // === 2. DEBOUNCING ===
   const debouncedInputs = useDebounce(inputs, 500)

   // === 3. DATA FETCHING ===
   useEffect(() => {
      let cancelled = false

      async function loadHourlyData() {
         try {
            const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
            const data = await fetchPoolHourData(pool.id, startTime)

            console.log('🔍 Query params:', {
               poolId: pool.id,
               startTime,
               startDate: new Date(startTime * 1000).toISOString(),
               expectedSnapshots: 7 * 24 // 168
            })

            if (data?.length > 0) {
               const actualHours = (data[data.length - 1].periodStartUnix - data[0].periodStartUnix) / 3600
               console.log('📊 Coverage:', {
                  snapshots: data.length,
                  actualHours: Math.round(actualHours),
                  completeness: (data.length / 168 * 100).toFixed(1) + '%'
               })
            }

            // 🔍 DIAGNOSTIC
            console.group('🔍 Hourly Data Diagnostic')
            console.log('Pool ID:', pool.id)
            console.log('Requested startTime:', new Date(startTime * 1000))
            console.log('Data received:', data?.length || 0, 'snapshots')
            if (data?.length > 0) {
            console.log('First snapshot:', {
               time: new Date(data[0].periodStartUnix * 1000),
               token0Price: data[0].token0Price,
               liquidity: data[0].liquidity,
               feesUSD: data[0].feesUSD
            })
            console.log('Last snapshot:', {
               time: new Date(data[data.length - 1].periodStartUnix * 1000),
               token0Price: data[data.length - 1].token0Price
            })
            }
            console.groupEnd()

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

   // === 4. EVENT HANDLERS ===
   const handleInputChange = useCallback((field, value) => {
      setInputs(prev => ({ ...prev, [field]: value }))
   }, [])

   // === 5. PRICE CALCULATIONS (DEFENSIVE) ===
   // 5.1 Get current price (prefer hourly data)
   const { token0PriceUSD, token1PriceUSD } = useMemo(() => {
      const currentPrice = hourlyData?.[0]?.token0Price
         ? parseFloat(hourlyData[0].token0Price)
         : parseFloat(pool.token0Price)
      
      const tvlUSD = parseFloat(pool.totalValueLockedUSD)
      const tvl0 = parseFloat(pool.totalValueLockedToken0)
      const tvl1 = parseFloat(pool.totalValueLockedToken1)

      // 5.2 Basic validation
      if (tvlUSD <= 0 || tvl0 <= 0 || tvl1 <= 0 || currentPrice <= 0) {
         return { token0PriceUSD: 0, token1PriceUSD: 0 }
      }

      // 5.3 Try inference formula first
      let price1USD = tvlUSD / (tvl0 / currentPrice + tvl1)
      let price0USD = price1USD / currentPrice

      // 5.4 Validate inference result (sanity check)
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

      // 5.5 If inference failed, use stablecoin heuristic as fallback
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

   // === 6. DISPLAY ===
   const displayPrice = useMemo(() => {
      const price = selectedTokenIdx === 0
         ? Number(pool.token0Price)
         : Number(pool.token1Price)

      return price
   }, [selectedTokenIdx, pool.token0Price, pool.token1Price])

   const priceLabel = useMemo(() => {
      return selectedTokenIdx === 0
         ? `${pool.token0.symbol} per ${pool.token1.symbol}`
         : `${pool.token1.symbol} per ${pool.token0.symbol}`
   }, [selectedTokenIdx, pool.token0.symbol, pool.token1.symbol])

   // === 7. RESULTS (MEMOIZED) ===
   const results = useMemo(() => {
      if (!hourlyData) return null

      return simulateRangePerformance({
         capitalUSD: debouncedInputs.capitalUSD,
         minPrice: debouncedInputs.minPrice === "" ? null : Number(debouncedInputs.minPrice),
         maxPrice: debouncedInputs.maxPrice === "" ? null : Number(debouncedInputs.maxPrice),
         fullRange: debouncedInputs.fullRange,
         selectedTokenIdx,
         hourlyData,
         pool
      })
   }, [debouncedInputs, selectedTokenIdx, hourlyData, pool])

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
                  currentPrice={displayPrice}
                  priceLabel={priceLabel}
                  token0Symbol={pool.token0.symbol}
                  token1Symbol={pool.token1.symbol}
                  token0PriceUSD={token0PriceUSD}
                  token1PriceUSD={token1PriceUSD}
               />
            </div>
         </div>
      </div>
   )
}