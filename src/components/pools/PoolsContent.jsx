import { useMemo } from "react"
import filterPools from "../../utils/filterPools"
import PoolFilters from "./PoolFilters"
import PoolTable from "./PoolTable"
import PoolCards from "./PoolCards"

export default function PoolsContent({
   resolvedPools,
   filters,
   updateFilter,
   togglePlatform,
   clearFilters,
   isDesktop
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
            isDesktop
            ? <PoolTable pools={filteredPools} />
            : <PoolCards pools={filteredPools} />
         )}
      </>
   )
}