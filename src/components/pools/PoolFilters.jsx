import Dropdown from "../common/Dropdown"

export default function PoolFilters({
   filters, 
   updateFilter,
   togglePlatform,
   clearFilters,
   availablePlatforms
}) {

   return (
      <div className="flex flex-wrap gap-2 mb-4 p-4 bg-base-100 rounded-box">
         <label className="form-control max-w-xs">
            <div className="label">
               <span className="label-text">Coin/Pair</span>
            </div>
            <input 
               type="text"
               placeholder="SOL or SOL/USDC"
               value={filters.search}
               className="input input-bordered input-sm"
               onChange={(e) => updateFilter("search", e.target.value)}
            />
         </label>

         <label className="form-control w-full max-w-xs">
            <div className="label">
               <span className="label-text">Platform</span>
            </div>
            <Dropdown 
               selected={filters.platforms}
               onToggle={togglePlatform}
               options={availablePlatforms}
            />
         </label>

         <label className="form-control w-full max-w-xs">TVL
            <input 
               type="number"
               placeholder="Min TVL ($)"
               value={filters.tvlUsd}
               className="input input-bordered input-sm"
               onChange={(e) => updateFilter("tvlUsd", e.target.value)}
            />
         </label>

         <label className="form-control w-full max-w-xs">Vol (24h)
            <input 
               type="number"
               placeholder="Min 24h Vol ($)"
               value={filters.volumeUsd1d}
               className="input input-bordered input-sm"
               onChange={(e) => updateFilter("volumeUsd1d", e.target.value)}
            />
         </label>

         <label className="form-control w-full max-w-xs">Risk
            <select 
               value={filters.riskLevel}
               onChange={(e) => updateFilter("riskLevel", e.target.value)}
               className="select select-bordered select-sm"
            >
               <option value="">All</option>
               <option value="Low">Low</option>
               <option value="Medium">Medium</option>
               <option value="High">High</option>
            </select>
         </label>

         <div className="flex items-end">
            <button
               onClick={clearFilters}
               className="btn btn-sm btn-ghost"
            >
               Clear
            </button>
         </div>
      </div>
   )

}