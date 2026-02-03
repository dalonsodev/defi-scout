import { MiniSparkline } from "../../common/MiniSparkline"

/**
 * SparklineCell - Renders 7-day APY sparkline with freemium fallback
 *
 * @param {string} poolId - Pool identifier for cache lookup
 * @param {Object<string, number[]>} sparklineData - Global cache (poolId → APY history)
 * @returns {JSX.Element}
 */
export function SparklineCell({ poolId, sparklineData }) {
   const data = sparklineData?.[poolId]

   if (!data) {
      return (
         <div className="flex justify-center">
            <div
               className="tooltip tooltip-left cursor-help py-2.5"
               data-tip="Upgrade to Pro for unlimited sparklines"
            >
               <span className="text-xs text-base-content/40 font-medium min-h-10">
                  ⟢ Pro
               </span>
            </div>
         </div>
      )
   }

   return <MiniSparkline data={data} />
}
