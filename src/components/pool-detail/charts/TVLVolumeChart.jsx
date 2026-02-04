import { useMemo } from 'react'
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
} from 'recharts'
import { CustomTooltip } from './CustomTooltip'
import { CHART_COLORS } from '../../../constants/chartColors'
import { formatCompactCurrency } from '../../../utils/formatCompactCurrency'

/**
 * UI: Capital Efficiency & Liquidity Chart.
 * Correlates Total Value Locked (TVL) with Trading Volume to assess pool health.
 * @param {Object} props
 * @param {Array<Object>} props.history - Timeseries data from the pool API
 * @returns {JSX.Element}
 */
export function TVLVolumeChart({ history }) {
  // Logic: Calculate capital efficiency ratio (Volume / TVL)
  // Higher ratios indicate better fee generation per dollar of liquidity
  const historyWithRatio = useMemo(() => {
    if (!history) return []

    return history.map((day) => ({
      ...day,
      volumeToTvlRatio: day.tvlUSD > 0 ? day.volumeUSD / day.tvlUSD : 0
    }))
  }, [history])

  return (
    <div className="card bg-base-200 rounded-2xl">
      <h3 className="text-lg font-semibold mb-4">TVL & Volume</h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
        <ComposedChart data={historyWithRatio}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />

          <XAxis
            dataKey="dateShort"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '10px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />

          {/* Axis Left: TVL & Volume (USD Denominated) */}
          <YAxis
            yAxisId="left"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />

          {/* Axis Right: Efficiency Ratio (Decimal) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
          />

          {/* Background: TVL represents the "depth" of the pool */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="tvlUSD"
            fill={CHART_COLORS.dataViz.tvl}
            stroke={CHART_COLORS.dataViz.tvl}
            fillOpacity={0.6}
            name="TVL"
          />

          {/* Middle: Volume represents the "activity" */}
          <Bar
            yAxisId="right"
            dataKey="volumeUSD"
            fill={CHART_COLORS.dataViz.volume}
            opacity={0.7}
            name="Volume"
          />

          {/* Foreground: Efficiency Ratio (The most important trend) */}
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
