import { useRef, useCallback } from 'react'

// Specialized error to distinguish between network failures and UI-driven cancellations
class CancellationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CancellationError'
    this.isCancellation = true
  }
}

/**
 * Executes a subset of the queue with a hard limit on parallel promises.
 * Returns results and any leftover items if an HTTP 429 is encountered.
 */
async function processBatchWithConcurrencyLimit(batch, concurrencyLimit) {
  const results = []

  for (let i = 0; i < batch.length; i += concurrencyLimit) {
    const chunk = batch.slice(i, i + concurrencyLimit)
    const promises = chunk.map((item) => item.fetchFn())

    // Use allSettled to prevent one failed request from dropping the entire batch
    const chunkResults = await Promise.allSettled(promises)
    results.push(...chunkResults)

    // Detection: If a 429 is found, we stop immediately to protect the API key
    const has429InChunk = chunkResults.some(
      (result) =>
        result.status === 'rejected' && result.reason?.isHttpError === true,
    )

    if (has429InChunk) {
      const remaining = batch.slice(i + concurrencyLimit)
      return { results, remaining, has429: true }
    }
  }

  return { results, remaining: [], has429: false }
}

/**
 * Custom Hook: Token Bucket Rate Limiter with Circuit Breaker
 *
 * Architecture: Implements a client-side queue to throttle API requests and prevent
 * HTTP 429 errors when fetching sparkline data for 8k+ pools. Uses a token bucket
 * algorithm (on-demand refill) instead of setInterval for better performance.
 *
 * Circuit Breaker Pattern: On first 429 error, immediately flushes the queue and
 * switches to "Pro upgrade" UI instead of retrying (fail-fast approach).
 *
 * @param {Object} config
 * @param {number} config.maxTokens - Bucket capacity (e.g. 80)
 * @param {number} config.refillRate - Tokens per second (e.g. 1.2)
 * @param {number} [config.concurrencyLimit=10] - Max parallel requests per batch
 *
 * @returns {Object} Queue interface
 * @returns {Function} returns.queueRequest - (id, priority, fetchFn) => Promise
 * @returns {Function} returns.cancelPendingRequests - Cleanup for unmount
 * @returns {boolean} returns.isRateLimited - True if 429 encountered
 *
 * @example
 * const { queueRequest } = useRequestQueue({
 *    maxTokens: 80,
 *    refillRate: 1.2
 * })
 *
 * queueRequest({
 *    id: "pool-123",
 *    priority: 1, // Lower = higher priority
 *    fetchFn: () => fetch("/api/sparkline/123")
 * })
 */
export function useRequestQueue({
  maxTokens,
  refillRate,
  concurrencyLimit = 10,
}) {
  // Use refs for scheduling state to avoid re-renders during high-frequency networking
  const queueRef = useRef([])
  const tokensRef = useRef(maxTokens)
  const lastRefillRef = useRef(Date.now())
  const processingRef = useRef(false)
  const isRateLimitedRef = useRef(false)

  /**
   * Token Bucket Algorithm: Calculates available quota based on elapsed time.
   */
  function getAvailableTokens() {
    const now = Date.now()

    // Check skew protection: Reset if system time moves backwards
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
    return (tokensRef.current -= count)
  }

  async function processQueue() {
    // Guard: Do not attempt processing if locked or already running
    if (processingRef.current || isRateLimitedRef.current) return

    processingRef.current = true

    try {
      while (queueRef.current.length > 0) {
        const available = Math.floor(getAvailableTokens())
        const batchSize = Math.min(available, queueRef.current.length)

        if (batchSize === 0) break

        // Priority: Lower numbers process first (visible pools > background prefetch)
        queueRef.current.sort((a, b) => a.priority - b.priority)
        const batch = queueRef.current.splice(0, batchSize)
        consumeTokens(batch.length)

        const { results, remaining, has429 } =
          await processBatchWithConcurrencyLimit(batch, concurrencyLimit)

        // Resolve/Reject: Bridge pattern to complete original queueRequest() promises
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            batch[i].resolve(result.value)
          } else {
            batch[i].reject(result.reason)
          }
        })

        if (has429) {
          // Global State Lock: Halt all networking and flush queue to trigger Pro UI
          console.warn(
            `[Queue] Rate limit reached - switching to Pro upgrade mode`,
          )
          isRateLimitedRef.current = true

          remaining.forEach((item) =>
            item.reject({ status: 429, isHttpError: true }),
          )
          queueRef.current.forEach((item) =>
            item.reject({ status: 429, isHttpError: true }),
          )
          queueRef.current = []

          break
        }
      }
    } catch (err) {
      // Unexpected error: Log for debugging but don't crash UI
      console.warn('There was an error: ', err)
    } finally {
      processingRef.current = false

      // Reschedule: Wait for next token refill if items remain in queue
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
    queueRef.current.forEach((item) =>
      item.reject(new CancellationError('Request cancelled')),
    )
    queueRef.current = []
  }, [])

  return {
    queueRequest,
    cancelPendingRequests,
    isRateLimited: isRateLimitedRef.current,
  }
}
