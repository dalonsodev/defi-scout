import { useMemo, useState, useEffect } from "react"
import filterPools from "../../utils/filterPools"
import PoolFilters from "./PoolFilters"
import PoolTable from "./PoolTable"
import PaginationControls from "../common/PaginationControls"
import useSparklines from "../../hooks/useSparklines"

export default function PoolsContent({
   resolvedPools,
   filters,
   updateFilter,
   togglePlatform,
   clearFilters,
}) {
   const availablePlatforms = useMemo(() => {
      if (!resolvedPools) return []

      const uniqueProjects = [...new Set(resolvedPools.map(pool => pool.project))]

      return uniqueProjects.map(project => ({
         value: project,
         display: resolvedPools.find(p => p.project === project)?.platformName || project
      })).sort((a, b) => a.display.localeCompare(b.display))
   }, [resolvedPools])

   const filteredPools = useMemo(() => {
      if (!resolvedPools || !Array.isArray(resolvedPools)) return []
      return filterPools(resolvedPools, filters)
   }, [resolvedPools, filters])

   const [pageIndex, setPageIndex] = useState(0)
   const pageSize = 40
   const totalPages = Math.ceil(filteredPools.length / pageSize)

   const paginatedPools = useMemo(() => {
      const start = pageIndex * pageSize
      const end = start + pageSize
      return filteredPools.slice(start, end)
   }, [filteredPools, pageIndex, pageSize])

   useEffect(() => {
      setPageIndex(0)
   }, [filters])

   const handlePageChange = (newPage) => {
      setPageIndex(newPage - 1) // convert from 1-based to 0-based
   }

   const { sparklineData } = useSparklines({
      visiblePools: paginatedPools
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
            <div className="overflow-hidden bg-base-200 mx-0 sm:-mx-2 md:mx-0 rounded-3xl shadow-lg">
               <PoolTable 
                  pools={paginatedPools} 
                  sparklineData={sparklineData}
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