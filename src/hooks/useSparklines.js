import { useRef, useState, useEffect } from "react"

export default function useSparklines({ visiblePoolIds, queueRequest, cancelPendingRequests }) {
   const cache = useRef({})
   const [_, setSparklineData] = useState({})

   useEffect(() => {
      if (!visiblePoolIds || visiblePoolIds.size === 0) return

      const poolIds = Array.from(visiblePoolIds)
      const missingIds = poolIds.filter(id => !cache.current[id])

      if (missingIds.length === 0) return

      missingIds.forEach(async poolId => {
         try {
            const data = await queueRequest({
               id: poolId,
               priority: 1,
               fetchFn: () => fetch(`https://yields.llama.fi/chart/${poolId}`)
                  .then(res => res.json())
            })

            const last7 = data.data
               .slice(-7)
               .map(snapshot => snapshot.apyBase)

            cache.current[poolId] = last7
            setSparklineData({ ...cache.current })

         } catch (err) {
            if (err.isCancellation) return
            console.warn(`Sparkline fetch failed for ${poolId}: `, err)
         }
      })

      return () => cancelPendingRequests()

   }, [visiblePoolIds, queueRequest, cancelPendingRequests])
   
   return { sparklineData: cache.current }
}