// APY = (Fees acumulados / Edad en días / TVL) * 365 * 100

export function formatPoolData(rawPools) {
   // helper: formatNumber()
   function formatNumber(n) {
      if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
      if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
      return n.toFixed(2)
   }

   // helper: calculatePoolAge()
   function calculatePoolAge(createdAtTimestamp) {
      const poolAgeDays = (Date.now() / 1000 - createdAtTimestamp) / 86400
      return poolAgeDays
   }

   // helper: calculateAPY()
   function calculateAPY(
      collectedFeesUSD, 
      volumeUSD,
      feeTier,
      poolAgeDays, 
      totalValueLockedUSD
   ) {
      if (poolAgeDays < 1) return 0
      if (totalValueLockedUSD === 0) return 0
      if (!poolAgeDays || !totalValueLockedUSD) return 0

      let feesForCalculation = collectedFeesUSD

      if (collectedFeesUSD < 100) {
         const feeRate = feeTier / 1000000
         feesForCalculation = volumeUSD * feeRate
      }

      if (!feesForCalculation) return 0

      const dailyFeeRate = feesForCalculation / poolAgeDays / totalValueLockedUSD
      const apyBase = dailyFeeRate * 365 * 100   
      
      return apyBase
   }

   return rawPools.map(pool => {
      const feeTier = parseFloat(pool.feeTier)
      const liquidity = parseFloat(pool.liquidity)
      const tvlUsd = parseFloat(pool.totalValueLockedUSD)
      const volumeUsd1d = parseFloat(pool.volumeUSD)
      const token0Price = parseFloat(pool.token0Price)
      const token0tvl = parseFloat(pool.totalValueLockedToken0)
      const token0Vol = parseFloat(pool.volumeToken0)
      const token0feesUSD = parseFloat(pool.collectedFeesToken0)
      const token1tvl = parseFloat(pool.totalValueLockedToken1)
      const token1Vol = parseFloat(pool.volumeToken1)
      const token1feesUSD = parseFloat(pool.collectedFeesToken1)
      const feesUSD = parseFloat(pool.collectedFeesUSD)
      const poolAgeDays = calculatePoolAge(pool.createdAtTimestamp)

      const apyBase = calculateAPY(
         feesUSD, 
         volumeUsd1d,
         feeTier,
         poolAgeDays, 
         tvlUsd
      )

      return {
         id: pool.id,
         symbol: `${pool.token0.symbol} / ${pool.token1.symbol || "UNKNOWN"}`,
         feeTier,
         feeTierFormatted: `${feeTier / 10000}%`,
         name: `${pool.token0.symbol} / ${pool.token1.symbol || "LP Pool"}`,
         chain: "ethereum",
         project: "uniswap-v3",
         platformName: "Uniswap V3",
         apyBase,
         apyFormatted: `${apyBase.toFixed(2)}%`,
         liquidity: liquidity || 0,
         liquidityFormatted: formatNumber(liquidity),
         tvlUsd: tvlUsd || 0,
         tvlFormatted: formatNumber(tvlUsd),
         volumeUsd1d: volumeUsd1d || 0,
         volumeFormatted: formatNumber(volumeUsd1d),
         feesUSD: feesUSD || 0,
         feesUSDFormatted: formatNumber(feesUSD),
         poolAgeDays,
         token0Price: token0Price || 0,
         token0id: pool.token0.id,
         token0symbol: pool.token0.symbol,
         token0name: pool.token0.name,
         token0PriceFormatted: formatNumber(token0Price),
         token0tvl: token0tvl || 0,
         token0tvlFormatted: formatNumber(token0tvl),
         token0Vol: token0Vol || 0,
         token0VolFormatted: formatNumber(token0Vol),
         token0feesUSD: token0feesUSD || 0,
         token0feesUSDFormatted: formatNumber(token0feesUSD),
         token1id: pool.token1.id,
         token1symbol: pool.token1.symbol,
         token1name: pool.token1.name,
         token1tvl: token1tvl || 0,
         token1tvlFormatted: formatNumber(token1tvl),
         token1Vol: token1Vol || 0,
         token1VolFormatted: formatNumber(token1Vol),
         token1feesUSD: token1feesUSD || 0,
         token1feesUSDFormatted: formatNumber(token1feesUSD),
      }
   })
}