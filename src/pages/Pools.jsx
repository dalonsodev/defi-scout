import React from "react"
import { useLoaderData, Await } from "react-router-dom"

function getRiskBadge(risk) {
   const badgeMap = {
      Low: "badge-success",
      Medium: "badge-warning",
      High: "badge-error"
   }
   return badgeMap[risk] || "badge-neutral"
}

function renderPools(pools) {
   return pools.map(pool => (
      <div key={pool.id} className="card bg-base-200 shadow p-4 m-2">
      <h3>{pool.name}</h3>
      <p>Chain: {pool.chain} | APY: {pool.apy}% | TVL: {pool.tvl}</p>
      <p>Risk: 
         <span className={`badge ${getRiskBadge(pool.risk)}`}>
            {pool.risk}
         </span>
      </p>
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