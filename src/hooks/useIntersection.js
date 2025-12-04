import { useState, useEffect } from "react"

export default function useIntersection(refs, options = {}) {
   const [visibleIds, setVisibleIds] = useState(new Set())

   useEffect(() => {
      const observer = new IntersectionObserver(
         (entries) => {
            entries.forEach(entry => {
               const poolId = entry.target.dataset.poolId

               if (entry.isIntersecting) {
                  setVisibleIds(prev => {
                     if (prev.has(poolId)) return prev
                     return new Set(prev).add(poolId)
                  })
               }
            })
         }, 
         options
      )

      refs.forEach(ref => {
         if (ref.current) {
            observer.observe(ref.current)
         }
      })

      return () => observer.disconnect()
   }, [refs, options])

   return visibleIds
}