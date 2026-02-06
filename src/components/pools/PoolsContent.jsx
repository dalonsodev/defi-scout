import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { usePrevious } from '../../hooks/usePrevious'
import { useRequestQueue } from '../../hooks/useRequestQueue'
import { useSparklines } from '../../hooks/useSparklines'
import { parseSearchParams, updateSearchParams } from '../../utils/urlState'
import { filterPools } from './utils/filterPools'
import { sortPools } from './utils/sortPools'
import { PaginationControls } from '../common/PaginationControls'
import { PoolFilters } from './PoolFilters'
import { PoolTable } from './PoolTable'

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
 */
export function PoolsContent({
  pools,
  filters,
  updateFilter,
  togglePlatform,
  clearFilters
}) {
  // Platform dropdown options (sorted alphabetically)
  const availablePlatforms = useMemo(() => {
    if (!pools) return []

    const uniqueProjects = [...new Set(pools.map((pool) => pool.project))]

    return uniqueProjects
      .map((project) => ({
        value: project,
        display:
          pools.find((p) => p.project === project)?.platformName || project
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
  const sorting = useMemo(() => [{
    id: urlState.sortBy,
    desc: urlState.sortDir === 'desc'
  }], [urlState.sortBy, urlState.sortDir])

  // 4. Local state still needs useState
  const [visiblePoolIds, setVisiblePoolIds] = useState(new Set())

  // 5. Dirty checking for filters (to detect resets)
  const filtersKey = JSON.stringify(filters)
  const prevFiltersKey = usePrevious(filtersKey)
  const filtersChanged = prevFiltersKey !== undefined && prevFiltersKey !== filtersKey

  // 6. Derive pageIndex with reset logic
  const pageIndex = filtersChanged ? 0 : urlState.page

  const tableRef = useRef(null)
  const tableScrollRef = useRef(null)
  const isFirstRender = useRef(true)

  const handlePageChange = (newPage) => {
    updateSearchParams(navigate, searchParams, { page: newPage - 1 })
  }

  const handleSortingChange = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting)
      : updaterOrValue

    if (!newSorting || newSorting.length === 0) {
      updateSearchParams(navigate, searchParams, {
        sortBy: 'tvlUsd',
        sortDir: 'desc'
      })
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

  const scrollToTableTop = useCallback(() => {
    if (tableScrollRef.current && tableRef.current) {
      tableScrollRef.current.scrollTop = 0
      tableRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [])

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

    scrollToTableTop()

    if (tableRef.current) {
      tableRef.current.setAttribute('aria-live', 'polite')
      tableRef.current.setAttribute(
        'aria-label',
        `Showing page ${pageIndex + 1} of ${totalPages}`
      )
    }
  }, [pageIndex, totalPages, scrollToTableTop])

  const { queueRequest, cancelPendingRequests } = useRequestQueue({
    maxTokens: 20,
    refillRate: 1.2,
    concurrencyLimit: 10
  })

  const { sparklineData } = useSparklines({
    visiblePoolIds,
    queueRequest,
    cancelPendingRequests,
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">
            No pools match your filters
          </p>
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
          className="bg-base-200 mx-0 sm:-mx-2 md:mx-0 rounded-3xl shadow-lg"
        >
          <PoolTable
            ref={tableScrollRef}
            pools={paginatedPools}
            sparklineData={sparklineData}
            onVisiblePoolsChange={setVisiblePoolIds}
            currentPage={pageIndex + 1}
            sorting={sorting}
            onSortingChange={handleSortingChange}
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
