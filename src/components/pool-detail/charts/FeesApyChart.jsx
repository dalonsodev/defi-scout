import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CustomTooltip } from './CustomTooltip'
import { CHART_COLORS } from '../../../constants/chartColors'
import { formatCompactCurrency } from '../../../utils/formatCompactCurrency'

/**
 * UI: Historical Yield & Revenue Chart.
 * Renders dual-axis composed chart comparing daily fee revenue (USD) vs. annualized yield (APY).
 * @param {Object} props
 * @param {Array<Object>} props.history - Timeseries data from the pool API
 * @param {string} props.history[].dateShort - Formatted date for X-axis (e.g. "Jan 01")
 * @param {number} props.history[].feesUSD - Daily fee revenue in USD (Left Y-axis)
 * @param {number} props.history[].apy - Annualized Percentage Yield (Right Y-Axis)
 * @returns {JSX.Element}
 */
export function FeesApyChart({ history }) {
  return (
    <div className="card bg-base-200 rounded-2xl">
      <h3 className="text-lg font-semibold mb-4">Fees & APY</h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
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

          {/* Left axis: Fees (USD) - Primary metric */}
          <YAxis
            yAxisId="left"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />

          {/* Right axis: APY (percentage) - Secondary metric */}
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
