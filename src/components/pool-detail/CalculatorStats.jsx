export function CalculatorStats({ results, loading, fetchError }) {
   // Error de fetch (TheGraph falló)
   if (fetchError) {
      return (
         <div className="mb-6">
            <p className="text-error text-sm">Failed to load pool data: {fetchError}</p>
         </div>
      )
   }

   // Loading (hourlyData aún no cargó)
   if (loading || results === null) {
      return (
         <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
            <div className="text-4xl font-bold text-success mb-4 animate-pulse">$--</div>
            <div className="space-y-2">
               <div className="flex justify-between animate-pulse">
                  <span className="text-base-content/60">MONTHLY:</span>
                  <span>$-- --%</span>
               </div>
               <div className="flex justify-between animate-pulse">
                  <span className="text-base-content/60">YEARLY (APR):</span>
                  <span>$-- --%</span>
               </div>
            </div>
         </div>
      )
   }

   // Error de simulación (invalid range)
   if (!results.success) {
      return (
         <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
            <p className="text-error text-sm">{results.error}</p>
         </div>
      )
   }

   {results.dataQuality === "LIMITED" && (
      <div className="alert alert-warning mb-4">
         <span>⚠️ Limited historical data. APR estimate may be less accurate.</span>
      </div>
   )}

   // Success: mostrar stats
   const dailyFees = results.totalFeesUSD / 7 // 7 días de histórico
   const monthlyFees = dailyFees * 30
   const yearlyFees = dailyFees * 365
   const yearlyAPR = results.APR
   const monthlyAPR = yearlyAPR / 12

   return (
      <div className="mb-6">
         <h3 className="text-lg font-semibold mb-2">Estimated Fees (24h)</h3>
         <div className="text-4xl font-bold text-success mb-4">
            ${dailyFees.toFixed(2)}
         </div>
         
         <div className="space-y-2 mb-4">
            <div className="flex justify-between">
               <span className="text-base-content/60">MONTHLY:</span>
               <span className="font-semibold">
                  ${monthlyFees.toFixed(2)} <span className="text-success">{monthlyAPR.toFixed(2)}%</span>
               </span>
            </div>
            <div className="flex justify-between">
               <span className="text-base-content/60">YEARLY (APR):</span>
               <span className="font-semibold">
                  ${yearlyFees.toFixed(2)} <span className="text-success">{yearlyAPR.toFixed(2)}%</span>
               </span>
            </div>
         </div>

         <div className="flex gap-2">
            <button className="btn btn-sm btn-outline flex-1">Compare Pools</button>
            <button className="btn btn-sm btn-outline flex-1">Calculate IL</button>
         </div>
      </div>
   )
}