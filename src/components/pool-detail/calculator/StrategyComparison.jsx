export function StrategyComparison({
   hodlStrategy,
   lpStrategy,
   isCalculating
}) {
   const winner = lpStrategy?.pnl > hodlStrategy?.pnl ? "lp" : "hodl"

   // 🔍 DIAGNOSTIC
   console.log("HODL Strategy:", hodlStrategy)
   console.log("LP Strategy:", lpStrategy)

   return (
      <div className="grid gap-4">
         {/* HODL Card */}
         <StrategyCard 
            title="Strategy A: HODL"
            isWinner={winner === "hodl"}
            data={hodlStrategy}
            isCalculating={isCalculating}
         />
         {/* LP Card */}
         <StrategyCard 
            title="Strategy B: Uniswap V3"
            isWinner={winner === "lp"}
            data={lpStrategy}
            isCalculating={isCalculating}
         />
      </div>
   )
}

function StrategyCard({ title, isWinner, data, isCalculating }) {
   return (
      <div
         className={`
            card bg-base-300 rounded-2xl p-4 mb-4
            ${isWinner ? "ring-2 ring-success" : ""}
      `}>
         <div className="flex justify-between items-center mb-4">
            <h4 className="font">{title}</h4>
            {isWinner && (
               <span className="badge badge-success">Best</span>
            )}
         </div>
         
         {isCalculating || !data ? (
            <div className="skeleton h-32" />
         ) : (
            <div className="space-y-2">
               {/* Token composition */}
               <div className="text-sm">
                  <div className="flex justify-between">
                     <span className="text-base-content/60">{data.token0Symbol}</span>
                     <span>{data.amount0.toFixed(4)} ({data.token0Percent}%)</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-base-content/60">{data.token1Symbol}</span>
                     <span>{data.amount1.toFixed(4)} ({data.token1Percent}%)</span>
                  </div>
               </div>

               <div className="divider my-2" />

               {/* P&L metrics */}
               <div className="flex justify-between font-bold">
                  <span>Value</span>
                  <span>${data.totalValue.toFixed(2)}</span>
               </div>

               <div className="flex justify-between">
                  <span>P&L</span>
                  <span className={data.pnl >= 0 ? "text-success" : "text-error"}>
                     {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)} ({data.pnlPercent}%)
                  </span>
               </div>

               {/* LP-specific metrics */}
               {data.feesEarned !== undefined && (
                  <>
                     <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Fees Earned</span>
                        <span className="text-success">+${data.feesEarned.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-base-content/60">Impermanent Loss</span>
                        <span className="text-error">{data.ilPercent}%</span>
                     </div>
                  </>
               )}
            </div>
         )}
      </div>
   )
}