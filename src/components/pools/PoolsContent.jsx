import { useMemo, useState, useEffect, useRef } from "react"
import { PoolFilters } from "./PoolFilters"
import { PoolTable } from "./PoolTable"
import { PaginationControls } from "../common/PaginationControls"
import { useSparklines } from "../../hooks/useSparklines"
import { useRequestQueue } from "../../hooks/useRequestQueue"
import { filterPools } from "./utils/filterPools"
import { sortPools } from "./utils/sortPools"

/**
 * Component: Pool Data Pipeline Orchestrator
 * 
 * Architecture: Manages the full cycle of 8k+ pool dataset through
 * a client-side pipeline: Raw data => Filter => Sort => Paginate => Render
 * 
 * Key Decisions:
 * - Client-side processing: DeFiLlama API returns full dataset (no server pagination)
 * - pageSize: 40 items (DeFi industry standard: Uniswap=50, Curve=40, Aave=25)
 * - visiblePoolIds reset on filter/sort: Prevents stale sparkline cache when rows change
 * 
 * Performance Trade-off: Sorting 8k items on every column click (~50ms) vs server-side
 * queries (would add ~800ms network latency). Client-side wins for this dataset size.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.pools - Full pool dataset from poolsLoader (8k items)
 * @param {Object} props.filters - Active filters state (search, tvlUsd, volumeUsd1d etc.)
 * @param {Function} props.updateFilter - Updates individual filter key (triggers re-filter)
 * @param {Function} props.togglePlatform - Multi-select handler for platform dropdown
 * @param {Function} props.clearFilters - Reset all filters to defaults
 * @returns {JSX.Element}
 */
export function PoolsContent({
   pools,
   filters,
   updateFilter,
   togglePlatform,
   clearFilters,
}) {
   const availablePlatforms = useMemo(() => {
      if (!pools) return []

      const uniqueProjects = [...new Set(pools.map(pool => pool.project))]

      return uniqueProjects.map(project => ({
         value: project,
         display: pools.find(p => p.project === project)?.platformName || project
      })).sort((a, b) => a.display.localeCompare(b.display))
   }, [pools])

   const filteredPools = useMemo(() => {
      if (!pools || !Array.isArray(pools)) return []
      return filterPools(pools, filters)
   }, [pools, filters])

   const [pageIndex, setPageIndex] = useState(0)
   const [visiblePoolIds, setVisiblePoolIds] = useState(new Set())
   const [sorting, setSorting] = useState([{ id: "tvlUsd", desc: true }])
   const tableRef = useRef(null)
   const tableScrollRef = useRef(null)
   const isFirstRender = useRef(true)
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

   // Reset to page 1 and clear sparkline cache when filters change
   // (prevents showing cached data for rows that moved/disappeared)
   useEffect(() => {
      setPageIndex(0)
      setVisiblePoolIds(new Set())
   }, [filters])

   // Reset to page 1 and clear sparkline cache when sorting changes
   // (prevents showing cached data in new row order)
   useEffect(() => {
      setPageIndex(0)
      setVisiblePoolIds(new Set())
   }, [sorting])
   
   // Clear sparkline cache when navigating pages
   // (IntersectionObserver will trigger fresh fetches for new visible rows)
   useEffect(() => {
      setVisiblePoolIds(new Set())
   }, [pageIndex])

   // Auto-scroll to table top on pagination/filter/sort changes
   // Skip first render to prevent jump during initial load
   useEffect(() => {
      if (isFirstRender.current) {
         isFirstRender.current = false
         return
      }
      if (tableScrollRef.current && tableRef.current) {
         tableScrollRef.current.scrollTop = 0
         tableRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start"
         })
         tableRef.current.setAttribute("aria-live", "polite")
         tableRef.current.setAttribute("aria-label", `Showing page ${pageIndex + 1} of ${totalPages}`)
      }
   }, [pageIndex, totalPages])

   const handlePageChange = (newPage) => {
      setPageIndex(newPage - 1) // Convert from 1-based to 0-based
   }

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
               <p className="text-gray-500 text-lg mb-2">No pools match your filters</p>
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
