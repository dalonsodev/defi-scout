import React from "react"
import { useLoaderData, Await, useSearchParams } from "react-router-dom"
import Dropdown from "../components/common/Dropdown"

function getRiskBadge(risk) {
   const badgeMap = {
      Low: "badge-success",
      Medium: "badge-warning",
      High: "badge-error"
   }
   return badgeMap[risk] || "badge-neutral"
}

function renderPools(pools) {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
         {pools.map(pool => (
            <div key={pool.id} className="card bg-base-200 shadow p-4 m-2">
               <h3>{pool.name}</h3>
               <p>Chain: 
                  {pool.chain} | APY: {pool.apy}% | TVL: {pool.tvl}
               </p>
               <p>Platform: {pool.platform}</p>
               <p>Vol (24h): {pool.vol24h}</p>
               <p>Risk:{" "}
                  <span className={`badge ${getRiskBadge(pool.risk)}`}>
                     {pool.risk}
                  </span>
               </p>
            </div>
         ))}
      </div>
   )
}

export default function Pools() {
   const data = useLoaderData()

   const [ searchParams, setSearchParams ] = useSearchParams()

   const search = searchParams.get("search") || ""
   const tvl = searchParams.get("tvl") || ""
   const vol24h = searchParams.get("vol24h") || ""
   const risk = searchParams.get("risk") || ""
   const platforms = searchParams.getAll("platform")

   function handleFilterChange(key, value) {
      const newParams = new URLSearchParams(searchParams)
      if (value) {
         newParams.set(key, value)
      } else {
         newParams.delete(key)
      }
      setSearchParams(newParams)
   }

   function handlePlatformToggle(platform) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("platform")
      const updated = platforms.includes(platform)
         ? platforms.filter(p => p !== platform)
         : [...platforms, platform]
      updated.forEach(p => newParams.append("platform", p))
      setSearchParams(newParams)
   }

   return (
      <>
         <div className="flex flex-wrap gap-2 mb-4 p-4">
            <label className="form-control max-w-xs">
               <div className="label">
                  <span className="label-text">Coin/Pair</span>
               </div>
               <input 
                  type="text"
                  placeholder="SOL or SOL/USDC"
                  value={search}
                  className="input input-bordered input-sm"
                  onChange={(e) => handleFilterChange("search", e.target.value)}
               />
            </label>
            <label className="form-control w-full max-w-xs">
               <div className="label">
                  <span className="label-text">Platform</span>
               </div>
               <Dropdown 
                  selected={platforms}
                  onToggle={handlePlatformToggle}
               />
            </label>
            <label>TVL
               <input 
                  type="number"
                  placeholder="Min TVL ($)"
                  value={tvl}
                  className="input input-bordered input-sm"
                  onChange={(e) => handleFilterChange("tvl", e.target.value)}
               />
            </label>
            <label>Vol (24h)
               <input 
                  type="number"
                  placeholder="Min 24h Vol ($)"
                  value={vol24h}
                  className="input input-bordered input-sm"
                  onChange={(e) => handleFilterChange("vol24h", e.target.value)}
               />
            </label>
            <label>Risk
               <select 
                  value={risk}
                  onChange={(e) => handleFilterChange("risk", e.target.value)}
                  className="select select-bordered select-sm"
               >
                  <option value="">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
               </select>
            </label>
         </div>

         <React.Suspense fallback={<p className="text-center">Loading pools...</p>}>
            <Await resolve={data.pools}>
               {renderPools}
            </Await>
         </React.Suspense>
      </>
   )
}