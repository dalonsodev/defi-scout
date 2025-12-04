import { useRef, useCallback } from "react"

class CancellationError extends Error {
   constructor (message) {
      super(message)
      this.name = "CancellationError"
      this.isCancellation = true
   }
}

async function processBatchWithConcurrencyLimit(batch, concurrencyLimit) {
   const results = []
   
   for (let i = 0; i < batch.length; i += concurrencyLimit) {
      const chunk = batch.slice(i, i + concurrencyLimit)
      const promises = chunk.map(item => item.fetchFn())
      const chunkResults = await Promise.allSettled(promises)
      results.push(...chunkResults)

      const has429InChunk = chunkResults.some(result => 
         result.status === "rejected" && result.reason?.isHttpError === true
      )

      if (has429InChunk) {
         const remaining = batch.slice(i + concurrencyLimit)
         return { results, remaining, has429: true }
      }
   }
   
   return { results, remaining: [], has429: false }
}

export default function useRequestQueue({ maxTokens, refillRate, concurrencyLimit = 10 }) {
   const queueRef = useRef([])
   const tokensRef = useRef(maxTokens)
   const lastRefillRef = useRef(Date.now())
   const processingRef = useRef(false)
   const isRateLimitedRef = useRef(false)

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
      if (processingRef.current || isRateLimitedRef.current) return // Stop if rate limited
      
      processingRef.current = true

      try {
         while (queueRef.current.length > 0) {
            const available = Math.floor(getAvailableTokens())
            const batchSize = Math.min(available, queueRef.current.length)
   
            if (batchSize === 0) break

            queueRef.current.sort((a, b) => a.priority - b.priority)
            const batch = queueRef.current.splice(0, batchSize)
            consumeTokens(batch.length)

            const { results, remaining, has429 } = await processBatchWithConcurrencyLimit(
               batch, 
               concurrencyLimit
            )

            results.forEach((result, i) => {
               if (result.status === "fulfilled") {
                  batch[i].resolve(result.value)
               } else {
                  batch[i].reject(result.reason)
               }
            })

            if (has429) {
               console.warn(`[Queue] Rate limit reached - switching to Pro upgrade mode`)
               isRateLimitedRef.current = true
               
               remaining.forEach(item => item.reject({ status: 429, isHttpError: true }))
               queueRef.current.forEach(item => item.reject({ status: 429, isHttpError: true }))
               queueRef.current = []
               
               break
            }
         }
      } catch (err) {
         console.warn("There was an error: ", err)
      } finally {
         processingRef.current = false
         
         if (queueRef.current.length > 0 && !isRateLimitedRef.current) {
            setTimeout(() => processQueue(), 1000 / refillRate)
         }
      }
   }

   const queueRequest = useCallback(({ id, priority, fetchFn }) => {
      if (isRateLimitedRef.current) {
         return Promise.reject({ status: 429, isHttpError: true })
      }

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
      cancelPendingRequests,
      isRateLimited: isRateLimitedRef.current
   }
}