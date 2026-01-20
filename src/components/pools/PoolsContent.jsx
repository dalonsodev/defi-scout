import { useMemo, useState, useEffect, useRef } from "react"
import { PoolFilters } from "./PoolFilters"
import { PoolTable } from "./PoolTable"
import { PaginationControls } from "../common/PaginationControls"
import { useSparklines } from "../../hooks/useSparklines"
import { useRequestQueue } from "../../hooks/useRequestQueue"
import filterPools from "./utils/filterPools"
import sortPools from "./utils/sortPools"

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

   useEffect(() => {
      setPageIndex(0)
      setVisiblePoolIds(new Set())
   }, [filters])

   useEffect(() => {
      setPageIndex(0)
      setVisiblePoolIds(new Set())
   }, [sorting])
   
   useEffect(() => {
      setVisiblePoolIds(new Set())
   }, [pageIndex])

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
      setPageIndex(newPage - 1) // convert from 1-based to 0-based
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
                     currentPage={pageIndex + 1} // convert from 0-based to 1-based
                     onPageChange={handlePageChange}
                  />
               </div>
            </div>
         )}
      </>
   )
}