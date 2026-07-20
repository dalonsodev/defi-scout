import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePrevious } from '../../hooks/usePrevious'
import { useSparklines } from '../../hooks/useSparklines'
import { parseSearchParams, updateSearchParams } from '../../utils/urlState'
import { PaginationControls } from '../common/PaginationControls'
import { PoolFilters } from './PoolFilters'
import { PoolTable } from './PoolTable'
import { filterPools } from './utils/filterPools'
import { sortPools } from './utils/sortPools'
import type { OnChangeFn, SortingState } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { FormattedPool, ParamsState } from '../../types'

type Filters = Pick<ParamsState, 'search' | 'platforms' | 'tvlUsd' | 'volumeUsd1d'>

interface PoolsContentProps {
  pools: FormattedPool[]
  filters: Filters
  favoriteIds: Set<string>
  updateFilter: (key: string, value: unknown) => void
  togglePlatform: (platform: string) => void
  clearFilters: () => void
  toggleFavorite: (poolId: string) => Promise<void>
}

/**
 * Component: Pool Data Pipeline Orchestrator
 *
 * Architecture: Client-side pipeline (Filter → Sort → Paginate → Render)
 *
 * State Management:
 * - Filters/Sorting/Pagination: URL as SSOT (useSearchParams + derived values)
 * - visiblePoolIds: Local state for sparkline intersection observer cache
 * - Reset logic: Derived (pageIndex = 0 when filters change, avoids race conditions)
 *
 * Performance: JSON.stringify comparison runs once per filter/sort change (~<1ms)
 *
 * @param props
 * @param props.pools - Paginated pool dataset (40 items max)
 * @param props.filters - Current filter state from URL (search, platforms, tvlUsd, volumeUsd1d)
 * @param props.favoriteIds - Favorited pool IDs; used for O(1) isFavorited lookup
 * @param props.updateFilter - URL updater from usePoolFilters (not directly debounced)
 * @param props.togglePlatform - Platform multi-select handler
 * @param props.clearFilters - Reset all filters to defaults
 * @param props.toggleFavorite - Toggles favorite; opens auth modal if unauthenticated
 */
export function PoolsContent({
  pools,
  filters,
  favoriteIds,
  updateFilter,
  togglePlatform,
  clearFilters,
  toggleFavorite
}: PoolsContentProps): ReactNode {
  // Platform dropdown options (sorted alphabetically)
  const availablePlatforms = useMemo(() => {
    if (!pools) return []

    const uniqueProjects = [...new Set(pools.map((pool) => pool.project))]

    return uniqueProjects
      .map((project) => ({
        value: project,
        display: pools.find((p) => p.project === project)?.platformName ?? project
      }))
      .sort((a, b) => a.display.localeCompare(b.display))
  }, [pools])

  // Filter full dataset (8k pools) to matching subset
  const filteredPools = useMemo(() => {
    if (!pools || !Array.isArray(pools)) return []
    return filterPools(pools, filters)
  }, [pools, filters])

  // 1. Get URL state management tools
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // 2. Parse full URL state (sortBy, sortDir, page)
  const urlState = parseSearchParams(searchParams)

  // 3. Convert URL state to component format
  const sorting = useMemo(
    () => [
      {
        id: urlState.sortBy,
        desc: urlState.sortDir === 'desc'
      }
    ],
    [urlState.sortBy, urlState.sortDir]
  )

  // 4. Local state still needs useState
  const [visiblePoolIds, setVisiblePoolIds] = useState<Set<string>>(new Set())

  // 5. Dirty checking for filters (to detect resets)
  const filtersKey = JSON.stringify(filters)
  const prevFiltersKey = usePrevious(filtersKey)
  const filtersChanged = prevFiltersKey !== undefined && prevFiltersKey !== filtersKey

  // 6. Derive pageIndex with reset logic
  const pageIndex = filtersChanged ? 0 : urlState.page

  const tableRef = useRef<HTMLDivElement | null>(null)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)
  const isFirstRender = useRef(true)

  const handlePageChange = (newPage: number | string) => {
    updateSearchParams(navigate, searchParams, { page: (newPage as number) - 1 })
  }

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === 'function'
        ? (updaterOrValue as (old: SortingState) => SortingState)(sorting)
        : updaterOrValue

    if (!newSorting || newSorting.length === 0) {
      updateSearchParams(navigate, searchParams, {
        sortBy: 'tvlUsd',
        sortDir: 'desc'
      })
      return
    }

    const sortBy = newSorting[0].id
    const sortDir = newSorting[0].desc ? 'desc' : 'asc'
    updateSearchParams(navigate, searchParams, { sortBy, sortDir })
  }

  const pageSize = 40
  const totalPages = Math.ceil(filteredPools.length / pageSize)

  const sortedPools = useMemo(() => {
    return sortPools(filteredPools, sorting)
  }, [filteredPools, sorting])

  const paginatedPools = useMemo(() => {
    const start = pageIndex * pageSize
    const end = start + pageSize
    return sortedPools.slice(start, end)
  }, [sortedPools, pageIndex, pageSize])

  // Reset sparkline cache when page changes (prepares empty Set for IntersectionObserver)
  useEffect(() => {
    setVisiblePoolIds(new Set())
  }, [pageIndex])

  // Auto-scroll on pagination/filter/sort changes (legitimate UI side effect)
  useEffect(() => {
    // Skip first render to prevent jump during initial load
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0
    }

    if (tableRef.current) {
      tableRef.current.setAttribute('aria-live', 'polite')
      tableRef.current.setAttribute('aria-label', `Showing page ${pageIndex + 1} of ${totalPages}`)
    }
  }, [pageIndex, totalPages, filtersKey])

  // Derive Set<Object> from visible IDs + paginated data
  // useMemo prevents new Set() reference on every render (would re-trigger useSparklines effect)
  const visiblePools = useMemo(() => {
    return new Set(paginatedPools.filter((pool) => visiblePoolIds.has(pool.id)))
  }, [paginatedPools, visiblePoolIds])

  const { sparklineData } = useSparklines({
    visiblePools,
    currentPage: pageIndex + 1
  })

  return (
    <>
      <PoolFilters
        filters={filters}
        updateFilter={updateFilter}
        togglePlatform={togglePlatform}
        clearFilters={clearFilters}
        availablePlatforms={availablePlatforms}
      />

      {filteredPools.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-2 text-lg text-gray-500">No pools match your filters</p>
          <button
            onClick={clearFilters}
            className="btn btn-sm btn-primary mt-4"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div
          ref={tableRef}
          className="glass-surface mx-0 rounded-3xl sm:-mx-2 md:mx-0"
        >
          <PoolTable
            ref={tableScrollRef}
            pools={paginatedPools}
            sparklineData={sparklineData}
            onVisiblePoolsChange={setVisiblePoolIds}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
          />
          <div className="py-4">
            <PaginationControls
              totalPages={totalPages}
              currentPage={pageIndex + 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </>
  )
}
