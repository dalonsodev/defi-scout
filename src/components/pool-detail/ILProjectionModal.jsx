import { PriceInputSection } from "./PriceInputSection"
import { TimeLineControl } from "./TimeLineControl"
import { StrategyComparison } from "./StrategyComparison"
import { useProjectionCalculator } from "../../hooks/useProjectionCalculator"

export function ILProjectionModal({
   isOpen,
   onClose,
   poolData,
   rangeInputs,
   results
}) {
   const {
      hodlStrategy,
      lpStrategy,
      isCalculating,
      currentToken0PriceUSD,
      currentToken1PriceUSD,
      futureToken0Price,
      futureToken1Price,
      projectionDays,
      setFutureToken0Price,
      setFutureToken1Price,
      setProjectionDays,
      daysToBreakEven
   } = useProjectionCalculator(poolData, rangeInputs, results)

   return (
      <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
         <div className="modal-box max-w-xl bg-base-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold">Simulate Position Performance</h3>
               <button 
                  onClick={onClose}
                  className="btn btn-sm btn-circle btn-ghost"
               >
                  x
               </button>
            </div>

            {/* Content */}
            <StrategyComparison 
               hodlStrategy={hodlStrategy}
               lpStrategy={lpStrategy}
               isCalculating={isCalculating}
            />

            {/* User inputs */}
            <div className="space-y-6">
               <PriceInputSection 
                  token0Symbol={poolData.token0.symbol}
                  token1Symbol={poolData.token1.symbol}
                  currentToken0PriceUSD={currentToken0PriceUSD}
                  currentToken1PriceUSD={currentToken1PriceUSD}
                  futureToken0PriceUSD={futureToken0Price}
                  futureToken1PriceUSD={futureToken1Price}
                  onToken0PriceChange={setFutureToken0Price}
                  onToken1PriceChange={setFutureToken1Price}
               />
               <TimeLineControl 
                  days={projectionDays}
                  onDaysChange={setProjectionDays}
                  daysToBreakEven={daysToBreakEven}
               />
            </div>
         </div>
         <form 
            method="dialog"
            onClick={onClose}
            className="modal-backdrop"
         >
            <button>close</button>
         </form>
      </dialog>
   )
}