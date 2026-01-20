const RISK_RANK = { 
   low: 1, 
   medium: 2, 
   high: 3, 
   // Explicit fallbacks
   "": 999,
   "undefined": 999,
   "null": 999
}

const getSortValue = (pool, columnId) => {
   if (columnId === "riskLevel") {
      const value = (pool[columnId] ?? "medium").toString().toLowerCase()
      return RISK_RANK[value] ?? 999
   }
   if (["name", "chain", "platformName"].includes(columnId)) {
      return String(pool[columnId] ?? "")
   }
   return Number(pool[columnId] ?? 0)
}


export function sortPools(pools, sorting) {
   if (sorting.length === 0) {
      return pools
   }
   const { id, desc } = sorting[0]

   return [...pools].sort((a, b) => {
      const A = getSortValue(a, id)
      const B = getSortValue(b, id)

      const result = A > B ? 1 : A < B ? -1 : 0
      return desc ? -result : result
   })
}