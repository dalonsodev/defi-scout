import React from "react"
import { useLoaderData, Await } from "react-router-dom"
import { useMediaQuery } from "react-responsive"
import usePoolFilters from "../hooks/usePoolFIlters"
import PoolsContent from "../components/pools/PoolsContent"

export default function Pools() {
   const { pools: loaderPools } = useLoaderData()
   const isDesktop = useMediaQuery({ minWidth: 769 })

   const { 
      filters, 
      updateFilter, 
      togglePlatform, 
      clearFilters 
   } = usePoolFilters()

   return (
      <div className="mx-auto max-w-7xl">
         <header className="p-4">
            <h1 className="text-3xl font-bold">Top LP Pools</h1>
            <p className="text-gray-600">Liquidity pools with real volume and APY history</p>
         </header>

         <React.Suspense fallback={<p className="text-center py-8">Loading pools...</p>}>
            <Await resolve={loaderPools}>
               {(resolvedPools) => (
                  <PoolsContent 
                     resolvedPools={resolvedPools}
                     filters={filters}
                     updateFilter={updateFilter}
                     togglePlatform={togglePlatform}
                     clearFilters={clearFilters}
                     isDesktop={isDesktop}
                  />
               )}
            </Await>
         </React.Suspense>
      </div>
   )
}