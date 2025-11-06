import React from "react"
import { useLoaderData, Await } from "react-router-dom"

function renderPools(pools) {
   return pools.map(pool => (
      <div key={pool.id} className="card bg-base-200 shadow p-4 m-2">
      <h3>{pool.name}</h3>
      <p>Chain: {pool.chain} | APY: {pool.apy}% | TVL: {pool.tvl}</p>
      {/* REFACTOR nested ternary */}
      <p>Risk: <span className={`badge ${pool.risk === 'Low' 
         ? 'badge-success' 
         : pool.risk === 'Medium' 
            ? 'badge-warning' 
            : 'badge-error'}`}>{pool.risk}</span></p>
    </div>
   ))
}

export default function Pools() {
   const data = useLoaderData()

   return (
      <React.Suspense fallback={<p className="text-center">Loading pools...</p>}>
         <Await resolve={data.pools}>
            {renderPools}
         </Await>
      </React.Suspense>
   )
}