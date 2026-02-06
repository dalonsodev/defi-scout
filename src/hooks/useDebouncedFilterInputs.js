import { useState, useEffect, useRef } from 'react'
import { useDebounce } from './useDebounce'

/**
 * Custom Hook: Debounced Filter Inputs with Reset Guard
 *
 * Maintains responsive local state for text/number inputs while debouncing
 * expensive URL updates. Prevents race conditions during manual resets.
 *
 * Architecture:
 * - Local state: Instant visual feedback (no lag on typing)
 * - Debounced values: Delayed propagation to URL (500ms)
 * - Reset guard: useRef flag prevents debounced values from restoring after clearFilters
 *
 * Race Condition Fixed:
 * Without isResetting flag, this sequence causes infinite loop:
 * 1. User types "SOL" → debouncedSearch='SOL' (after 500ms)
 * 2. clearFilters() → URL becomes empty → filters.search=''
 * 3. Effect 1 sees: debouncedSearch='SOL' !== filters.search='' → restores 'SOL' to URL
 * 4. Effect 2 syncs URL back → localFilters.search='SOL'
 * 5. This triggers new debounce with 'SOL' → infinite ping-pong
 *
 * Solution: isResetting flag tells Effect 1 to skip one cycle after resetLocalFilters(),
 * allowing URL clear to complete before debounced values propagate empty strings.
 *
 * @param {Object} filters - Current filter state from URL
 * @param {Function} updateFilter - Callback to update URL params
 * @returns {{
 *   localFilters: Object,
 *   updateLocalFilter: Function,
 *   resetLocalFilters: Function
 * }}
 */
export function useDebouncedFilterInputs(filters, updateFilter) {
  const [localFilters, setLocalFilters] = useState({
    search: filters.search,
    tvlUsd: filters.tvlUsd,
    volumeUsd1d: filters.volumeUsd1d
  })

  const debouncedSearch = useDebounce(localFilters.search, 500)
  const debouncedTvl = useDebounce(localFilters.tvlUsd, 500)
  const debouncedVolume = useDebounce(localFilters.volumeUsd1d, 500)

  // Race condition guard: prevents debounced values from restoring after manual clear
  const isResetting = useRef(false)

  // Effect 1: Propagate debounced values to URL (with reset guard)
  useEffect(() => {
    // Skip one cycle after resetLocalFilters to prevent restoring old values
    if (isResetting.current) {
      isResetting.current = false
      return
    }

    if (debouncedSearch !== filters.search) {
      updateFilter('search', debouncedSearch)
    }
    if (debouncedTvl !== filters.tvlUsd) {
      updateFilter('tvlUsd', debouncedTvl)
    }
    if (debouncedVolume !== filters.volumeUsd1d) {
      updateFilter('volumeUsd1d', debouncedVolume)
    }
  }, [debouncedSearch, debouncedTvl, debouncedVolume, filters.search, filters.tvlUsd, filters.volumeUsd1d, updateFilter])

  // Effect 2: Sync URL back to local
  useEffect(() => {
    setLocalFilters({
      search: filters.search,
      tvlUsd: filters.tvlUsd,
      volumeUsd1d: filters.volumeUsd1d
    })
  }, [filters.search, filters.tvlUsd, filters.volumeUsd1d])

  const updateLocalFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  // Cleanup API: Resets local state and sets guard to prevent debounce restoration
  // Must be called BEFORE clearFilters() to coordinate URL reset with local state
  const resetLocalFilters = () => {
    isResetting.current = true
    setLocalFilters({
      search: '',
      tvlUsd: '',
      volumeUsd1d: ''
    })
  }

  return {
    localFilters,
    updateLocalFilter,
    resetLocalFilters
  }
}
