import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const COLORS = ["#605dff", "#01d390"]

export function TokenInfoBlock({ pool, selectedTokenIdx, onTokenChange }) {

   const pieData = useMemo(() => {
      const tvl0 = parseFloat(pool.totalValueLockedToken0)
      const tvl1 = parseFloat(pool.totalValueLockedToken1)

      // Guard against division by 0
      if (tvl0 === 0 && tvl1 === 0) {
         return []
      }

      return [
         {name: pool.token0.symbol, value: tvl0}, 
         {name: pool.token1.symbol, value: tvl1}
      ]
   }, [pool.totalValueLockedToken0, pool.totalValueLockedToken1, pool.token0.symbol, pool.token1.symbol])

   const totalValue = useMemo(() => {
      return pieData.reduce((acc, curr) => acc + curr.value, 0)
   }, [pieData])

   const currentPrice = useMemo(() => {
      const price0 = parseFloat(pool.token0Price)
      const price1 = parseFloat(pool.token1Price)

      if (isNaN(price0) || isNaN(price1)) return null

      return selectedTokenIdx === 0 ? price0 : price1
   }, [pool.token0Price, pool.token1Price, selectedTokenIdx])

   const truncateAddress = (address) => {
      if (!address || address.length < 10) return "N/A"
      return address.slice(0,6) + "..." + address.slice(-4)
   }

   // ===== Helper Components =====

   function TokenLink({ token }) {
      return (
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{token.symbol}</span>
            <a 
               href={`https://etherscan.io/address/${token.id}`}
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-primary hover:underline"
            >
               {truncateAddress(token.id)}
               <span className="ml-1">↗</span>
            </a>
         </div>
      )
   }

   return (
      <div className="rounded-2xl bg-base-200 mb-4">
         {/* Current Price */}
         {currentPrice && (
            <div className="mb-3 p-3 rounded-lg bg-base-300">
               <div className="text-xs text-base-content/60 mb-1">
                  Current Price
               </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                     {currentPrice.toFixed(currentPrice < 1 ? 8 : 2)}
                  </span>
                  <span className="text-base text-base-content/70">
                     {selectedTokenIdx === 0 ? pool.token0.symbol : pool.token1.symbol}
                  </span>
                  <span className="text-xs text-base-content/50">
                     per {selectedTokenIdx === 0 ? pool.token1.symbol : pool.token0.symbol}
                  </span>
               </div>
            </div>
         )}

         {/* Toggle Button Group */}
         <div className="join">
            <button 
               className={`btn join-item ${selectedTokenIdx === 0 ? "btn-active" : ""}`}
               onClick={() => onTokenChange(0)}
            >
               {pool.token0.symbol}
            </button>
            <button 
               className={`btn join-item ${selectedTokenIdx === 1 ? "btn-active" : ""}`}
               onClick={() => onTokenChange(1)}
            >
               {pool.token1.symbol}
            </button>
         </div>

         {/* Contract links */}
         <div className="mt-4 space-y-2">
            <TokenLink token={pool.token0} />
            <TokenLink token={pool.token1} />
         </div>

         {/* Mini PieChart */}
         {pieData.length > 0 && (
            <div className="mt-4">
               <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                     <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={(entry) => {
                           const percent = ((entry.value / totalValue) * 100).toFixed(1)
                           return `${entry.name} - ${percent}%`
                        }}
                        labelLine={false}
                     >
                        {pieData.map((_, index) => (
                           <Cell 
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]} // modulo to avoid out-of-bounds
                           />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
            </div>
         )}
      </div>
   )
}