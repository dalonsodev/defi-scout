import { CHART_COLORS } from "../../../constants/chartColors"
import { formatCompactCurrency } from "../../../utils/formatCompactCurrency"

export function CustomTooltip({ active, payload, label }) {
   if (!active || !payload || payload.length === 0) {
      return null
   }

   return (
      <div 
         className="rounded-lg p-3 shadow-lg border"
         style={{
            backgroundColor: CHART_COLORS.tooltip.bg,
            borderColor: CHART_COLORS.tooltip.border,
            color: CHART_COLORS.tooltip.text
         }}
      >
         {/* Date header */}
         <p className="font-semibold mb-2">{label}</p>

         {/* Aquí irán las métricas */}
         {payload.map((entry, index) => {
            let formattedValue

            if (entry.dataKey === "volumeToTvlRatio") {
               formattedValue = entry.value.toFixed(1)
            } else if (entry.dataKey === "apy") {
               formattedValue = `${entry.value.toFixed(1)}%`
            } else {
               formattedValue = formatCompactCurrency(entry.value)
            }

            return (
               <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                     <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                     />
                     <span className="text-sm">{entry.name}:</span>
                  </div>
                  <span className="text-sm font-semibold">{formattedValue}</span>
               </div>
            )
         })}
      </div>
   )
}