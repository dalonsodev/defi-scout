import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { PoolFilters } from './PoolFilters'
import { PoolTable } from './PoolTable'
import { PaginationControls } from '../common/PaginationControls'
import { useSparklines } from '../../hooks/useSparklines'
import { useRequestQueue } from '../../hooks/useRequestQueue'
import { usePrevious } from '../../hooks/usePrevious'
import { filterPools } from './utils/filterPools'
import { sortPools } from './utils/sortPools'

/**
 * Component: Pool Data Pipeline Orchestrator
 *
 * Architecture: Client-side pipeline (Filter → Sort → Paginate → Render)
 *
 * Refactored State Management (4 effects → 2 effects):
 * - pageIndex: Derived from userPageIndex + dirty checking (eliminates 2 sync effects)
 * - visiblePoolIds: Reset via effect when pageIndex changes (legitimate cache prep)
 * - Scroll: Effect for UI side effect (not state synchronization)
 *
 * Performance: JSON.stringify comparison runs once per filter/sort change (~<1ms)
 */
export function PoolsContent({
  pools,
  filters,
  updateFilter,
  togglePlatform,
  clearFilters,
}) {
  // Platform dropdown options (sorted alphabetically)
  const availablePlatforms = useMemo(() => {
    if (!pools) return []

    const uniqueProjects = [...new Set(pools.map((pool) => pool.project))]

    return uniqueProjects
      .map((project) => ({
        value: project,
        display:
          pools.find((p) => p.project === project)?.platformName || project,
      }))
      .sort((a, b) => a.display.localeCompare(b.display))
  }, [pools])

  // Filter full dataset (8k pools) to matching subset
  const filteredPools = useMemo(() => {
    if (!pools || !Array.isArray(pools)) return []
    return filterPools(pools, filters)
  }, [pools, filters])

  // User-driven state
  const [userPageIndex, setUserPageIndex] = useState(0)
  const [visiblePoolIds, setVisiblePoolIds] = useState(new Set())
  const [sorting, setSorting] = useState([{ id: 'tvlUsd', desc: true }])

  const tableRef = useRef(null)
  const tableScrollRef = useRef(null)
  const isFirstRender = useRef(true)

  // Dirty checking: Detect when filters/sorting change by comparing serialized keys
  const filtersKey = JSON.stringify(filters)
  const sortingKey = JSON.stringify(sorting)

  const prevFiltersKey = usePrevious(filtersKey)
  const prevSortingKey = usePrevious(sortingKey)

  // Check undefined to skip comparison on first render
  const filtersChanged =
    prevFiltersKey !== undefined && prevFiltersKey !== filtersKey
  const sortingChanged =
    prevSortingKey !== undefined && prevSortingKey !== sortingKey
  const shouldResetPage = filtersChanged || sortingChanged

  // Derived pageIndex: Reset to 0 when filters/sorting change, else respect user navigation
  const pageIndex = shouldResetPage ? 0 : userPageIndex

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

  const handlePageChange = (newPage) => {
    setUserPageIndex(newPage - 1)
  }

  const scrollToTableTop = useCallback(() => {
    if (tableScrollRef.current && tableRef.current) {
      tableScrollRef.current.scrollTop = 0
      tableRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
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
        `Showing page ${pageIndex + 1} of ${totalPages}`,
      )
    }
  }, [pageIndex, totalPages, scrollToTableTop])

  const { queueRequest, cancelPendingRequests } = useRequestQueue({
    maxTokens: 20,
    refillRate: 1.2,
    concurrencyLimit: 10,
  })

  const { sparklineData } = useSparklines({
    visiblePoolIds,
    queueRequest,
    cancelPendingRequests,
    currentPage: pageIndex + 1,
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
            onSortingChange={setSorting}
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
