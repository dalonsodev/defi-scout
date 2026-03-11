import { useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { CustomTVLTooltip } from './CustomTVLTooltip'
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

  const weeklyTicks = useMemo(() => {
    return historyWithRatio.filter((_, i) => i % 7 === 0)
  }, [historyWithRatio])

  const tickLabelMap = useMemo(() => {
    return new Map(weeklyTicks.map((d) => [d.dateTimestamp, d.dayLabel]))
  }, [weeklyTicks])

  const dateShortMap = useMemo(() => {
    return new Map(historyWithRatio.map((d) => [d.dateTimestamp, d.dateShort]))
  }, [historyWithRatio])

  return (
    <div className="card bg-base-200 rounded-2xl">
      <h3 className="text-lg font-semibold mb-4">TVL & Volume</h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
        <ComposedChart data={historyWithRatio}>

          <XAxis
            dataKey="dateTimestamp"
            tick={{ dy: 5 }}
            ticks={weeklyTicks.map((d) => d.dateTimestamp)}
            tickFormatter={(v) => tickLabelMap.get(v) ?? ''}
            axisLine={false}
            tickLine={false}
            style={{ fontSize: '12px' }}
          />

          {/* Axis Left: TVL & Volume (USD Denominated) */}
          <YAxis
            yAxisId="left"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
            axisLine={false}
            tickLine={false}
          />

          {/* Axis Right: Efficiency Ratio (Decimal) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => formatCompactCurrency(value)}
            axisLine={false}
            tickLine={false}
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

          {/* Foreground: Volume represents the "activity" */}
          <Bar
            yAxisId="right"
            dataKey="volumeUSD"
            fill={CHART_COLORS.dataViz.volume}
            opacity={0.7}
            name="Volume"
          />

          <Tooltip content={
            <CustomTVLTooltip dateShortMap={dateShortMap} />
          } />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
