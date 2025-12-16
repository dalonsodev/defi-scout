import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer
} from "recharts"
import { CustomPriceTooltip } from "./CustomPriceTooltip"
import { CHART_COLORS } from "../../utils/chartColors"
import { formatCompactCurrency } from "../../utils/formatCompactCurrency"

export function PriceChart({ history, selectedTokenIdx, tokenSymbols }) {
   const dataKey = selectedTokenIdx === 0 ? "token0Price" : "token1Price"
   const selectedSymbol = tokenSymbols[selectedTokenIdx]
   
   return (
      <div className="card bg-base-200 rounded-2xl">
         <h3 className="text-lg font-semibold mb-4">
            Price - {selectedSymbol}
         </h3>

         <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
            <LineChart data={history}>
               <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />

               <XAxis 
                  dataKey="dateShort"
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "10px" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
               />

               <YAxis 
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "11px" }}
                  tickFormatter={(value) => (
                     value > 1
                        ? formatCompactCurrency(value)
                        : value.toFixed(6)
                  )}
               />

               <Line 
                  type="monotone"
                  dataKey={dataKey}
                  stroke={CHART_COLORS.dataViz.price}
                  strokeWidth={2}
                  dot={false}
                  name={`${selectedSymbol} Price`}
               />

               <Tooltip content={
                  <CustomPriceTooltip 
                     tokenSymbols={tokenSymbols}
                     selectedTokenIdx={selectedTokenIdx}
                  />
               } />
            </LineChart>
         </ResponsiveContainer>
      </div>
   )
}