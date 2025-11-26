import { defer } from "react-router-dom"

function formatNumber(n) {
   if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
   if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
   if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
   return n.toString()
}

const platformBranding = {
   "uniswap-v2": "Uniswap V2",
   "uniswap-v3": "Uniswap V3",
   "sushiswap": "SushiSwap",
   "pancakeswap": "PancakeSwap",
   "curve-dex": "Curve",
   "balancer": "Balancer",
   "quickswap": "QuickSwap",
   "spiritswap": "SpiritSwap",
   "spookyswap": "SpookySwap",
   "traderjoe": "Trader Joe",
   "camelot": "Camelot",
   "orca": "Orca",
   "benqui": "BENQUI",
   "biswap": "Biswap"
}

function formatPlatform(platformName) {
   if (!platformName) {
      return "Unknown"
   }

   const key = platformName.toLowerCase()
   if (platformBranding[key]) {
      return platformBranding[key]
   }

   return platformName
      .replace(/-/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/ v(\d)/gi, " V$1")
      .replace(/ slipstream/gi, "")
      .replace(/ liquidity/gi, "")
      .replace(/ dex/gi, "")
      .replace(/ amm/gi, "")
}

function formatName(name) {
   if (!name) {
      return "LP Pool"
   }
   return name
      .replace(/-/g, " / ")
}

async function fetchDeFiLlama() {
   try {
      const res = await fetch("https://yields.llama.fi/pools")

      if (!res.ok) {
         throw new Error("DeFiLlama pools fetch failed")
      }
      const { data } = await res.json()

      const lpPools = data
         .filter(pool => pool.exposure === "multi")
         .filter(pool => (pool.volumeUsd1d || 0) > 0)
   
      return lpPools.map((pool) => ({
         id: pool.pool,
         name: formatName(pool.symbol) || "LP Pool",
         symbol: pool.symbol || "UNKNOWN",
         chain: pool.chain,
         project: pool.project,
         platformName: formatPlatform(pool.project),
         apyBase: Number(pool.apyBase.toFixed(2)),
         apyFormatted: `${pool.apyBase.toFixed(2)}%`,
         tvlUsd: pool.tvlUsd || 0,
         tvlFormatted: formatNumber(pool.tvlUsd) || 0,
         volumeUsd1d: pool.volumeUsd1d || 0,
         volumeFormatted: formatNumber(pool.volumeUsd1d) || 0,
         riskLevel: pool.apyBase > 15 ? "High" : pool.apyBase > 8 ? "Medium" : "Low"
      }))
   } catch (err) {
      console.error("DeFiLlama error:", err)
      return []
   }
}

export function poolsLoader() {
   return defer({
      pools: fetchDeFiLlama()
   })
}
