import { TVLVolumeChart } from "./TVLVolumeChart"
import { PriceChart } from "./PriceChart"
import { FeesApyChart } from "./FeesApyChart"

export function PoolCharts({ history, selectedTokenIdx, tokenSymbols }) {
   if (!history || history.length === 0) {
      return (
         <div className="card bg-base-200 rounded-2xl p-8 text-center">
            <p className="text-base-content/60">No historical data available</p>
         </div>
      )
   }

   return (
      <div className="grid grid-cols-1 gap-4">
         <PriceChart 
            history={history} 
            selectedTokenIdx={selectedTokenIdx} 
            tokenSymbols={tokenSymbols}
         />
         <TVLVolumeChart history={history} />
         <FeesApyChart history={history} />
      </div>
   )
}