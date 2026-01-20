import { fetchPools } from "../services/theGraphClient"
import { formatPoolData } from "./utils/formatPoolData"

async function fetchUniswapPools() {
   try {
      const rawPools = await fetchPools({
         first: 1000,
         skip: 0,
         orderBy: "totalValueLockedUSD",
         orderDirection: "desc",
         minTVL: "0",
         minVol: "0"
      })
      
      return formatPoolData(rawPools)
   } catch (err) {
      console.error("The Graph error:", err)
      return []
   }
}

export async function poolsLoader() {
   const pools = await fetchUniswapPools()
   return { pools }
}