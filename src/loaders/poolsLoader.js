import { defer } from "react-router-dom"

function formatNumber(n) {
   if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B"
   if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
   if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
   return n.toString()
}

async function fetchDeFiLlama() {
   try {
      const res = await fetch("https://yields.llama.fi/pools?limit=30")

      if (!res.ok) {
         throw new Error("DeFiLlama pools fetch failed")
      }
      const { data } = await res.json()

      const lpPools = data
         .filter(pool => pool.exposure === "multi")
         .filter(pool => (pool.volumeUsd1d || 0) > 0)
         .slice(0, 20)
   
      const poolsWithSparkline = await Promise.all(
         lpPools.map(async (pool) => {
            const basePool = {
               id: pool.pool,
               name: pool.symbol || "LP Pool",
               symbol: pool.symbol || "UNKNOWN",
               chain: pool.chain,
               platform: pool.project,
               apy: pool.apy.toFixed(2) || 0,
               tvl: formatNumber(pool.tvlUsd) || 0,
               vol24h: formatNumber(pool.volumeUsd1d) || 0,
               risk: pool.apy > 15 ? "High" : pool.apy > 8 ? "Medium" : "Low"
            }

            try {
               const chartRes = await fetch(`https://yields.llama.fi/chart/${pool.pool}`)
               if (!chartRes.ok) {
                  throw new Error("Chart fetch failed")
               }
               const chart = await chartRes.json()

               const history = chart.data.slice(-7)
               const sparklineIn7d = history.length > 0
                  ? history.map(day => day.apy || 0)
                  : null
               
               return { ...basePool, sparklineIn7d }
            } catch {
               return { ...basePool, sparklineIn7d: null }
            }
         })
      )
      return poolsWithSparkline
   } catch (err) {
      console.error("DeFiLlama error:", err)
      return []
   }
}

export async function poolsLoader() {
   const pools = await fetchDeFiLlama()

   return defer({ pools })
}
