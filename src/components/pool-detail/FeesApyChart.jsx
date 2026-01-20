import {
   ComposedChart,
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

export function FeesApyChart({ history }) {
   return (
      <div className="card bg-base-200 rounded-2xl">
      <h3 className="text-lg font-semibold mb-4">Fees & APY</h3>

      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
        <ComposedChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          
          <XAxis 
            dataKey="dateShort"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '10px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          {/* Left axis: Fees (USD) */}
          <YAxis 
            yAxisId="left"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />
          
          {/* Right axis: APY (percentage) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="feesUSD"
            stroke={CHART_COLORS.dataViz.fees}
            strokeWidth={2}
            dot={false}
            name="Fees"
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="apy"
            stroke={CHART_COLORS.dataViz.apy}
            strokeWidth={2}
            dot={false}
            name="APY"
          />
          
          <Tooltip content={<CustomTooltip />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
   )
}