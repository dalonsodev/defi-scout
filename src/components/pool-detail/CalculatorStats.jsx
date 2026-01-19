import { useState } from "react"
import { ILProjectionModal } from "./ILProjectionModal"

export function CalculatorStats({ 
   results, 
   isLoading, 
   fetchError,
   poolData,
   rangeInputs
}) {
   const [isModalOpen, setIsModalOpen] = useState(false)

   // Error de fetch (TheGraph falló)
   if (fetchError) {
      return (
         <div className="mb-6">
            <p className="text-error text-sm">Failed to load pool data: {fetchError}</p>
         </div>
      )
   }

   // Loading (hourlyData aún no cargó)
   if (isLoading || results === null) {
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

   // Success: mostrar stats
   const dailyFees = results.dailyFeesUSD // From simulation
   const monthlyFees = dailyFees * 30
   const yearlyFees = dailyFees * 365
   const yearlyAPR = results.APR
   const monthlyAPR = yearlyAPR / 12

   // Data quality disclaimer
   const hasLimitedData = results.daysOfData < 7

   return (
      <>
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

            {/* Data Quality Warning */}
            {hasLimitedData && (
               <div className="alert alert-warning text-xs mb-4">
                  ⚠️ Based on {results.daysOfData.toFixed(1)} days. Projections may be vary.
               </div>
            )}

            <div className="flex gap-2">
               <button className="btn btn-sm btn-outline">Compare Pools</button>
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-sm btn-outline flex-1"
               >
                  Simulate Position Performance
               </button>
            </div>
         </div>

         {/* Simulate Position Performance Modal */}
         <ILProjectionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            poolData={poolData}
            rangeInputs={rangeInputs}
            results={results}
         />
      </>
   )
}