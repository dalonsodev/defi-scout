import { useState, useEffect } from 'react'
import { useDebounce } from './useDebounce'

/**
 * Debounced filter inputs with consolidated effects.
 * 2 useEffects total: one for local→URL, one for URL→local sync.
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

  // Effect 1: Propagate debounced values to URL (only when they differ)
  useEffect(() => {
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

  // Effect 2: Sync URL back to local (for back/forward navigation)
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

  return {
    localFilters,
    updateLocalFilter
  }
}
