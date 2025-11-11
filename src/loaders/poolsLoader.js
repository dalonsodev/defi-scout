import { defer } from "react-router-dom"

async function fetchDeFiLlama() {
   try {
      const res = await fetch("https://yields.llama.fi/pools")

      if (!res.ok) {
         throw new Error("DeFiLlama fetching pools failed")
      }
      const { data } = await res.json()
   
      return data.slice(0, 20).map(pool => ({
            id: pool.pool,
            name: pool.symbol || pool.project || "Unknown",
            chain: pool.chain,
            platform: pool.project,
            apy: pool.apy.toFixed(2) || 0,
            tvl: pool.tvlUsd || 0,
            vol24h: pool.volumeUsd1d || 0,
            risk: pool.apy > 15 ? "High" : pool.apy > 8 ? "Medium" : "Low",
            symbol: pool.symbol || "UNKNOWN"
         }))
   } catch (err) {
      console.error("DeFiLlama error:", err)
      return []
   }
}

async function fetchCoinGecko(pools) {
   try {
      const apiKey = import.meta.env.VITE_COINGECKO_DEMO_KEY
      if (!apiKey) {
         console.warn("CoinGecko API was not set up")
      }

      const symbols = [...new Set(
         pools
            .map(pool => pool.symbol)
            .filter(sym => sym && sym !== "UNKNOWN" && sym.trim() !== "")
      )]
   
      if (symbols.length === 0) return pools
   
      const ids = symbols.map(sym => sym.toLowerCase()).join(",")
      const priceUrl = `
         https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&x_cg_demo_api_key=${apiKey}
      `
      const priceRes = await fetch(priceUrl)
      if (!priceRes.ok) {
         throw new Error("CoinGecko price fetching failed")
      }
      const prices = await priceRes.json()
   
      const sparkPromises = symbols.map(async (sym) => {
         const id = sym.toLowerCase()
         const sparkUrl = `
            https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&x_cg_demo_api_key=${apiKey}
         `
         const sparkRes = await fetch(sparkUrl)
         if (!sparkRes.ok) {
            return { [id]: { prices: [] } }
         }
         const data = await sparkRes.json()
         
         return { [id]: { prices: data.prices.map(price => price[1]) } }
      })
      const sparkData = await Promise.all(sparkPromises)
      const sparklines = Object.assign({}, ...sparkData)
   
      return pools.map(pool => {
         const id = pool.symbol?.toLowerCase()
         return {
            ...pool,
            price: prices[id]?.usd || 0,
            sparkline7d: sparklines[id]?.prices || []
         }
      })
   } catch (err) {
      console.error("CoinGecko error:", err)
      return pools.map(pool => ({
         ...pool,
         price: 0,
         sparkline7d: []
      }))
   }
}

export async function poolsLoader() {
   const defiPools = await fetchDeFiLlama()

   if (defiPools.length === 0) {
      return defer({ pools: [] })
   }

   const enrichedPools = await fetchCoinGecko(defiPools)

   return defer({ pools: enrichedPools })
}
