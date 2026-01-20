export function calculateTokenPrices(pool, currentPrice) {
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
      const STABLE_SYMBOLS = ["USDT", "USDC", "DAI", "BUSD", "FRAX", "TUSD", "USDD"]
      const token0IsStable = STABLE_SYMBOLS.includes(pool.token0.symbol)
      const token1IsStable = STABLE_SYMBOLS.includes(pool.token1.symbol)

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
}