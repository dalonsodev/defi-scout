import { useMemo } from "react"
import {
   ComposedChart,
   Area,
   Bar,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer
} from "recharts"
import { CustomTooltip } from "./CustomTooltip"
import { CHART_COLORS } from "../../constants/chartColors"
import { formatCompactCurrency } from "../../utils/formatCompactCurrency"

export function TVLVolumeChart({ history }) {
   const historyWithRatio = useMemo(() => {
      return history.map(day => ({
         ...day,
         volumeToTvlRatio: day.tvlUSD > 0 ? day.volumeUSD / day.tvlUSD : 0
      }))
   }, [history])

   return (
      <div className="card bg-base-200 rounded-2xl">
         <h3 className="text-lg font-semibold mb-4">TVL & Volume</h3>

         <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
            <ComposedChart data={historyWithRatio}>
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
                  yAxisId="left"
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "11px" }}
                  tickFormatter={(value) => formatCompactCurrency(value)}
               />

               <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "11px" }}
                  tickFormatter={(value) => formatCompactCurrency(value)}
               />

               <Area 
                  yAxisId="left"
                  type="monotone"
                  dataKey="tvlUSD"
                  fill={CHART_COLORS.dataViz.tvl}
                  stroke={CHART_COLORS.dataViz.tvl}
                  fillOpacity={0.6}
                  name="TVL"
               />

               <Bar 
                  yAxisId="right"
                  dataKey="volumeUSD"
                  fill={CHART_COLORS.dataViz.volume}
                  opacity={0.7}
                  name="Volume"
               />

               <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="volumeToTvlRatio"
                  stroke={CHART_COLORS.dataViz.ratio}
                  dot={false}
                  strokeWidth={2}
                  name="Vol/TVL ratio"
               />

               <Tooltip content={<CustomTooltip />} />
            </ComposedChart>
         </ResponsiveContainer>
      </div>
   )
}