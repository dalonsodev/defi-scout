/**
 * Utility: Conditional Debug Logger for Development Environment
 * 
 * Architecture: Vite's tree-shaking automatically removes this in production builds,
 * but the explicit MODE check provides a safety layer for edge cases (e.g. manual 
 * production dev server). Emojis improve log scanning in crowded consoles.
 * 
 * Performance: Zero overhead in production (dead code elimination at build time)
 * 
 * @param {string} label - Descriptive label for the log group
 * @param {*} data - Data to log (object, array, primitive)
 * 
 * @example
 * debugLog('Fee Calculation', { fees: 123, share: 0.5 })
 * // Development: 🔍 Fee Calculation: { fees: 123, share: 0.5 }
 * // Production: (nothing - stripped at build time)
 */
export function debugLog(label, data) {
   if (import.meta.env.MODE !== "production") {
      console.log(`🔍 ${label}:`, data)
   }
}
