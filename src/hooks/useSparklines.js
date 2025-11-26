import { useRef, useState, useEffect } from "react"
import { chunkArray } from "../utils/chunkArray"
import { delay } from "../utils/chunkArray"

export default function useSparklines({ visiblePools }) {
   const cache = useRef({})
   const [_, setLoadingBatch] = useState(0)
   const isLoading = useRef(false)

   const BATCH_SIZE = 20
   const DELAY_MS = 600

   useEffect(() => {
      if (!visiblePools || visiblePools.length === 0) return
      if (isLoading.current) return

      const poolIds = visiblePools.map(pool => pool.id)
      const missingIds = poolIds.filter(id => !cache.current[id])

      if (missingIds.length === 0) return

      fetchSparklines(missingIds)
   }, [visiblePools])

   async function fetchSparklines(poolIds) {
      isLoading.current = true

      const batches = chunkArray(poolIds, BATCH_SIZE)

      for (let i = 0; i < batches.length; i++) {
         const batch = batches[i]

         const promises = batch.map(async poolId => {
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

         setLoadingBatch(i + 1)

         if (i < batches.length - 1) {
            await delay(DELAY_MS)
         }
      }

      isLoading.current = false
      setLoadingBatch(0) // reset
   }
   
   return {
      sparklineData: cache.current,
      isLoading: isLoading.current
   }
}