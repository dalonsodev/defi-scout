import { useRef, useCallback } from "react"

class CancellationError extends Error {
   constructor (message) {
      super(message)
      this.name = "CancellationError"
      this.isCancellation = true
   }
}

export default function useRequestQueue({ maxTokens, refillRate }) {
   const queueRef = useRef([]) // Priority queue
   const tokensRef = useRef(maxTokens)
   const lastRefillRef = useRef(Date.now())
   const processingRef = useRef(false)


   function getAvailableTokens() {
      const now = Date.now()
   
      if (now < lastRefillRef.current) {
         lastRefillRef.current = now
         return tokensRef.current
      }
   
      const elapsed = (now - lastRefillRef.current) / 1000
      const generatedTokens = elapsed * refillRate
      tokensRef.current = Math.min(tokensRef.current + generatedTokens, maxTokens)
      lastRefillRef.current = now

      return tokensRef.current
   }

   function consumeTokens(count) {
      return tokensRef.current -= count
   }

   async function processQueue() {
      if (processingRef.current) return
      
      processingRef.current = true

      try {
         while (queueRef.current.length > 0) {
            const available = Math.floor(getAvailableTokens())
            const batchSize = Math.min(available, queueRef.current.length)
   
            if (batchSize === 0) break

            queueRef.current.sort((a, b) => a.priority - b.priority)

            const batch = queueRef.current.splice(0, batchSize)

            consumeTokens(batch.length)

            const promises = batch.map(item => item.fetchFn())
            const results = await Promise.allSettled(promises)

            results.forEach((result, i) => {
               if (result.status === "fulfilled") {
                  batch[i].resolve(result.value)
               } else {
                  batch[i].reject(result.reason)
               }
            })
         }
      } catch (err) {
         console.warn("There was an error: ", err)
      } finally {
         processingRef.current = false
      }
   }

   const queueRequest = useCallback(({ id, priority, fetchFn }) => {
      return new Promise((resolve, reject) => {
         queueRef.current.push({ id, priority, fetchFn, resolve, reject })
         
         processQueue()
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []) // Safe: closes over refs (stable) and internal functions (no external deps)

   const cancelPendingRequests = useCallback(() => {
      queueRef.current.forEach(item => (
         item.reject(new CancellationError("Request cancelled"))
      ))

      queueRef.current = []
   }, [])
   
   return {
      queueRequest,
      cancelPendingRequests
   }
}
