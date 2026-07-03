import { useRef, useEffect } from 'react'

/**
 * Custom Hook: Returns the previous value of a variable from the last render.
 *
 * Pattern: Ref updates happen AFTER render, so ref.current holds the value
 * from the previous render during current render execution.
 *
 * Use Case: Detecting changes in complex objects between renders
 *
 * @param value - Current value to track
 * @returns Previous value (undefined on first render)
 *
 * @example
 * const prevFilters = usePrevious(filters)
 * const changed = prevFilters !== filters // Compares by reference
 */
export function usePrevious<T>(value: T | undefined) {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value // Update after render commits
  })

  return ref.current // Return OLD value during render
}
