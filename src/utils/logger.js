/**
 * Conditional debug logger for development environment
 * Automatically strips logs in production builds
 * 
 * @param {string} label - Descriptive label for the log group
 * @param {*} data - Data to log (object, array, primitive)
 * 
 * @example
 * debugLog('Fee Calculation', { fees: 123, share: 0.5 })
 * // Development: 🔍 Fee Calculation: { fees: 123, share: 0.5 }
 * // Production: (nothing)
 */
export function debugLog(label, data) {
   if (!import.meta.env.MODE === "development") {
      console.log(`🔍 ${label}:`, data)
   }
}
