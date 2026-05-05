import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { CustomPriceTooltip } from './CustomPriceTooltip'
import { CHART_COLORS } from '../../../constants/chartColors'

// Maps window size (days) to label frequency (days) for X-axis readability
const LABEL_THRESHOLDS = [
  { max: 7, value: 1 },
  { max: 14, value: 2 },
  { max: 30, value: 3 }
]

/**
 * UI: Strategic Price & Range Chart.
 * Visualizes asset price trends against liquidity provider boundaries.
 * @param {Object} props
 * @param {Array<Object>} props.hourlyData - Timeseries data from the pool API
 * @param {number} props.selectedTokenIdx - Index of the token used as base price (0 or 1)
 * @param {string[]} props.tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param {Object} props.rangeInputs - Current simulation range (minPrice, maxPrice, assumedPrice)
 * @param {number} props.currentPrice - Live market price for the asset
 * @returns {JSX.Element}
 */
export function PriceChart({
  hourlyData,
  selectedTokenIdx,
  tokenSymbols,
  rangeInputs,
  currentPrice
}) {
  const dataKey = selectedTokenIdx === 0 ? 'token0Price' : 'token1Price'
  const selectedSymbol = tokenSymbols[selectedTokenIdx]
  const [baseToken, quoteToken] = tokenSymbols
  const poolPriceLabel = selectedTokenIdx === 0
    ? `${baseToken} / ${quoteToken}`
    : `${quoteToken} / ${baseToken}`

  const labelIntervalHours = useMemo(() => {
    if (!hourlyData?.length) return 7
    const daysInWindow = hourlyData.length / 24
    const labelEveryNDays = LABEL_THRESHOLDS.find((t) => daysInWindow <= t.max)?.value ?? 7
    return labelEveryNDays * 24
  }, [hourlyData])

  const visibleTicks = useMemo(() => {
    if (!hourlyData?.length) return []
    return hourlyData.filter((_, i) => i % labelIntervalHours === 0)
  }, [hourlyData, labelIntervalHours])

  const tickLabelMap = useMemo(() => {
    if (!hourlyData?.length) return new Map()
    return new Map(visibleTicks.map((d) => [d.periodStartUnix, d.dayLabel]))
  }, [hourlyData, visibleTicks])

  const dateShortMap = useMemo(() => {
    if (!hourlyData?.length) return new Map()
    return new Map(hourlyData.map((h) => [h.periodStartUnix, h.dateShort]))
  }, [hourlyData])

  const yDomain = useMemo(() => {
    if (!hourlyData?.length) return ['auto', 'auto']
    const prices = hourlyData.map((h) => h[dataKey]).filter(Boolean)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min

    if (range === 0) return [min * 0.9, max * 1.15]
    return [min - range * 0.15, max + range * 0.15]
  }, [hourlyData, dataKey])

  if (!hourlyData?.length) return null

  return (
    <div className="card glass-surface rounded-2xl p-4">
      <h3 className="mb-4 text-lg font-semibold">
        {poolPriceLabel + ' Pool Price'}
      </h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
        <LineChart data={hourlyData}>
          <XAxis
            dataKey="periodStartUnix"
            axisLine={false}
            ticks={visibleTicks.map((d) => d.periodStartUnix)}
            tickFormatter={(v) => tickLabelMap.get(v) ?? ''}
            tickLine={false}
            style={{ fontSize: '12px' }}
            textAnchor="end"
          />

          <YAxis
            hide
            stroke={CHART_COLORS.axis}
            style={{ fontSize: '11px' }}
            domain={yDomain}
          />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS.dataViz.price}
            strokeWidth={2}
            dot={false}
            name={`${selectedSymbol} Price`}
          />

          {currentPrice > 0 && (
            <ReferenceLine
              y={
                !rangeInputs.fullRange ? rangeInputs.assumedPrice : currentPrice
              }
              stroke={CHART_COLORS.primary}
              strokeDasharray="5 5"
            />
          )}

          {/* Concentrated Liquidity Bounds:
            Visualizes the "ticks" where the user's capital is active
            Hidden if "full range" is active as boundaries would be effectively [0, ∞]
          */}
          {!rangeInputs.fullRange && (
            <>
              <ReferenceLine
                y={rangeInputs.minPrice}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
              />
              <ReferenceLine
                y={rangeInputs.maxPrice}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
              />
            </>
          )}

          <Tooltip
            content={
              <CustomPriceTooltip
                tokenSymbols={tokenSymbols}
                selectedTokenIdx={selectedTokenIdx}
                dateShortMap={dateShortMap}
              />
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
