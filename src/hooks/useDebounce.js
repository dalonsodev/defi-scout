import { useState, useEffect, useRef } from "react"

/**
 * Custom Hook: Debounced Value (Leading Edge)
 * 
 * Delays the propagation of a value to prevent excesive re-renders or API calls
 * during rapid state changes (e.g. search input, slider dragging)
 * 
 * Implementation Detail: Skips debouncing on initial mount to allow hydration
 * effects to run with the actual value, not a stale initial state
 * 
 * When to use:
 * - Text inputs triggering API searches (delay: 300-500ms)
 * - Expensive calculations in response to slider changes (delay: 200ms)
 * 
 * Alternative: For deferring UI updates without delaying state, use React's
 * built-in useDeferredValue (Concurrent Mode only).
 * 
 * @param {*} value - The state value to be debounced
 * @param {number} delay - Time in milliseconds to wait before updating
 * @returns {*} The debounced value
 * 
 * @example
 * // Search input with 500ms debounce
 * const [searchTerm, setSearchTerm] = useState("")
 * const [debouncedSearch, setDebouncedSearch] = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *    fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce(value, delay) {
   const [debouncedValue, setDebouncedValue] = useState(value)
   const valueRef = useRef(value)

   useEffect(() => {
      // Skip debounce on initial mount (valueRef starts === value)
      if (valueRef.current !== value) {
         valueRef.current = value

         const handler = setTimeout(() => {
            setDebouncedValue(value)
         }, delay)
         
         return () => clearTimeout(handler)
      }
   }, [value, delay])

   return debouncedValue
}
