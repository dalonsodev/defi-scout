import React from "react"
import { useLoaderData, Await, useSearchParams } from "react-router-dom"

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

   // const platformOptions = [
   //    "UniswapV2", 
   //    "UniswapV3", 
   //    "Orca", 
   //    "Meteora", 
   //    "Camelot", 
   //    "PancakeSwap"
   // ] ------> Para sacar logica del return -> Componente /common/Dropdown.jsx ***

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
               <div className="dropdown">
                  <label tabIndex={0} className="btn btn-sm w-full justify-between">
                     {platforms.length > 0 ? `Selected (${platforms.length})` : "All Platforms"}
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </label>
                  <ul
                     className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                     tabIndex="0"
                  >
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("UniswapV2")}
                              onChange={() => handlePlatformToggle("UniswapV2")}
                           />
                           <span className="label-text ml-2">Uniswap V2</span>
                        </label>
                     </li>
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("UniswapV3")}
                              onChange={() => handlePlatformToggle("UniswapV3")}
                           />
                           <span className="label-text ml-2">Uniswap V3</span>
                        </label>
                     </li>
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("Orca")}
                              onChange={() => handlePlatformToggle("Orca")}
                           />
                           <span className="label-text ml-2">Orca</span>
                        </label>
                     </li>
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("Meteora")}
                              onChange={() => handlePlatformToggle("Meteora")}
                           />
                           <span className="label-text ml-2">Meteora</span>
                        </label>
                     </li>
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("Camelot")}
                              onChange={() => handlePlatformToggle("Camelot")}
                           />
                           <span className="label-text ml-2">Camelot</span>
                        </label>
                     </li>
                     <li>
                        <label className="label cursor-pointer">
                           <input 
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={platforms.includes("PancakeSwap")}
                              onChange={() => handlePlatformToggle("PancakeSwap")}
                           />
                           <span className="label-text ml-2">PancakeSwap</span>
                        </label>
                     </li>
                  </ul>
               </div>
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