import { useRef, useState, useEffect } from "react"

export default function useSparklines({ 
   visiblePoolIds, 
   queueRequest, 
   cancelPendingRequests, 
   currentPage
}) {
   const cache = useRef({})
   const [_, setSparklineData] = useState({})

   useEffect(() => {
      if (!visiblePoolIds || visiblePoolIds.size === 0) return

      if (currentPage > 10) return

      const poolIds = Array.from(visiblePoolIds)
      const missingIds = poolIds.filter(id => !cache.current[id])

      if (missingIds.length === 0) return

      missingIds.forEach(async poolId => {
         try {
            const data = await queueRequest({
               id: poolId,
               priority: 1,
               fetchFn: async () => {
                  try {
                     const res = await fetch(`https://yields.llama.fi/chart/${poolId}`)
   
                     if (!res.ok) {
                        throw { status: res.status, isHttpError: true }
                     }
   
                     return res.json()
                  } catch (err) {
                     if (err instanceof TypeError && err.message?.includes("Failed to fetch")) {
                        throw { status: 429, isHttpError: true }
                     }
                     throw err
                  }
               }
            })

            const last7 = data.data.slice(-7).map(snapshot => snapshot.apyBase)
            cache.current[poolId] = last7
            setSparklineData({ ...cache.current })

         } catch (err) {
            if (err.isCancellation) return
            if (err.status === 429) return
            console.warn(`Sparkline fetch failed for ${poolId}: `, err)
         }
      })

      return () => cancelPendingRequests()

   }, [visiblePoolIds, queueRequest, cancelPendingRequests, currentPage])
   
   return { sparklineData: cache.current }
}