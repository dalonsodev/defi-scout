import { useLoaderData } from "react-router-dom"
import { useMediaQuery } from "react-responsive"
import { usePoolFilters } from "../hooks/usePoolFIlters"
import { PoolsContent } from "../components/pools/PoolsContent"

/**
 * UI: Market Pools Explorer
 * Entry point for the liquidity pools discovery interface
 * Connects router data with global filtering logic
 * @returns {JSX.Element}
 */
export default function Pools() {
   const { pools } = useLoaderData()
   const isDesktop = useMediaQuery({ minWidth: 769 })

   const { 
      filters, 
      updateFilter, 
      togglePlatform, 
      clearFilters 
   } = usePoolFilters()

   return (
      <div className="mx-auto max-w-7xl">
         {/* SECTION: Header and context */}
         <header className="p-4">
            <h1 className="text-3xl font-bold">Top LP Pools</h1>
            <p className="text-gray-600">Liquidity pools with real volume and APY history</p>
         </header>

         {/* SECTION: Data orchestration */}
         <PoolsContent 
            pools={pools}
            filters={filters}
            updateFilter={updateFilter}
            togglePlatform={togglePlatform}
            clearFilters={clearFilters}
            isDesktop={isDesktop}
         />
      </div>
   )
}
