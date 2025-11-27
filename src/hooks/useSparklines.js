import { useRef, useState, useEffect } from "react"

export default function useSparklines({ visiblePoolIds }) {
   const cache = useRef({})
   const [sparklineData, setSparklineData] = useState({})
   const [_, setLoadingBatch] = useState(0)
   const isLoading = useRef(false)

   useEffect(() => {
      if (!visiblePoolIds || visiblePoolIds.size === 0) return
      if (isLoading.current) return

      const poolIds = Array.from(visiblePoolIds)
      const missingIds = poolIds.filter(id => !cache.current[id])

      if (missingIds.length === 0) return

      fetchSparklines(missingIds)
   }, [visiblePoolIds])

   async function fetchSparklines(poolIds) {
      isLoading.current = true

      const promises = poolIds.map(async poolId => {
         try {
            const res = await fetch(`https://yields.llama.fi/chart/${poolId}`)
            if (!res.ok) throw new Error(`Failed fetch for ${poolId}`)
               
            const json = await res.json()
            const data = json.data

            const last7 = data
               .slice(-7)
               .map(snapshot => snapshot.apyBase)

            return { poolId, data: last7 }

         } catch (err) {
            console.warn(`Sparkline fetch failed for ${poolId}:`, err)
            return { poolId, data: null }
         }
      })

      const results = await Promise.allSettled(promises)

      results.forEach(result => {
         if (result.status === "fulfilled" && result.value.data) {
            cache.current[result.value.poolId] = result.value.data
         }
      })

      setSparklineData({ ...cache.current })

      isLoading.current = false
      setLoadingBatch(0) // reset
   }
   
   return {
      sparklineData: cache.current,
      isLoading: isLoading.current
   }
}