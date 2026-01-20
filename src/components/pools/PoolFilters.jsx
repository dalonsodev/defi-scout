import { Dropdown } from "../common/Dropdown"

export function PoolFilters({
   filters, 
   updateFilter,
   togglePlatform,
   clearFilters,
   availablePlatforms
}) {

   return (
      <div className="flex flex-wrap gap-2 mb-4 p-4 bg-base-100">
         <label className="form-control max-w-xs">
            <div className="label">
               <span className="label-text">Coin/Pair</span>
            </div>
            <input 
               type="text"
               placeholder="SOL or SOL/USDC"
               value={filters.search}
               className="input input-bordered input-sm rounded-xl"
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
               className="input input-bordered input-sm rounded-xl"
               onChange={(e) => updateFilter("tvlUsd", e.target.value)}
            />
         </label>

         <label className="form-control w-full max-w-xs">Vol (24h)
            <input 
               type="number"
               placeholder="Min 24h Vol ($)"
               value={filters.volumeUsd1d}
               className="input input-bordered input-sm rounded-xl"
               onChange={(e) => updateFilter("volumeUsd1d", e.target.value)}
            />
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