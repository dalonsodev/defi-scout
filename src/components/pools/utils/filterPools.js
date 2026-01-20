export function filterPools(pools, filters) {
   if (!pools || !Array.isArray(pools)) return []

   return pools.filter(pool => {
      if (filters.search 
         && !pool.name.toLowerCase().includes(filters.search.toLocaleLowerCase())) return false
      if (filters.platforms.length > 0 && !filters.platforms.includes(pool.project)) return false
      if (filters.tvlUsd && pool.tvlUsd < Number(filters.tvlUsd)) return false
      if (filters.volumeUsd1d && pool.volumeUsd1d < Number(filters.volumeUsd1d)) return false
      
      return true
   })
}