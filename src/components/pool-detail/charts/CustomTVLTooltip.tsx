import { ReactNode } from 'react'
import type { TooltipContentProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { formatCompactCurrency } from '../../../utils/formatCompactCurrency'
import { CHART_COLORS } from '../../../constants/chartColors'

interface CustomTVLTooltipProps extends Partial<TooltipContentProps<ValueType, NameType>> {
  dateShortMap: Map<number, string>
}

/**
 * UI: Multi-Series Chart Tooltip (TVL + Vol + Vol/TVl ratio + Fees)
 *
 * Architecture: Dedicated tooltip for TVLVolumeChart displaying 2 metric types:
 * 1. Currency (TVL, Vol, Fees) => formatCompactCurrency ($1.2M)
 * 2. Ratio (Volume/TVL) => .toFixed(1) for clean decimal (0.5x vs $0.50)
 *
 * Design Decision: Rechart auto-injects "payload" array with all active data
 * series at cursor position. Each entry has: { name, value, color, datakey }
 *
 * Note: Fees row and volumeToTvlRatio are not in "payload", so we read both
 * data objects directly.
 *
 * @param props - Rechart tooltip props (auto-injected)
 * @param props.active - Visibility state (mouse hover)
 * @param props.payload - Active data series at cursor
 * @param props.payload[].entry - Single metric data
 * @param props.payload[].name - Display label (e.g. "TVL")
 * @param props.payload[].value - Raw numeric value
 * @param props.payload[].color - Hex color for legend dot
 * @param props.payload[].dataKey - Field name for formatting logic
 * @param props.label - X-axis value (formatted date)
 * @param props.dateShortMap - Resolves dateTimestamp -> dateShort
 * @returns Tooltip or null if inactive
 *
 * @example
 * // Example payload from TVLVolumeChart:
 * // [
 * //   { name: "TVL", value: 1234567, color: "#8b5cf6", dataKey: "tvlUSD" },
 * //   { name: "Volume", value: 89000, color: "#3b82f6", dataKey: "volumeUSD" },
 * // ]
 */
export function CustomTVLTooltip({
  active,
  payload,
  label,
  dateShortMap
}: CustomTVLTooltipProps): ReactNode | null {
  if (!active || !payload?.length) return null

  const labelAsNumber = typeof label === 'string' ? Number(label) : (label as number)
  const displayLabel = dateShortMap?.get(labelAsNumber) ?? label
  const feesUSD = payload[0]?.payload?.feesUSD
  const volumeToTvlRatio = payload[0]?.payload?.volumeToTvlRatio

  return (
    <div
      className="rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor: CHART_COLORS.tooltip.bg,
        borderColor: CHART_COLORS.tooltip.border,
        color: CHART_COLORS.tooltip.text
      }}
    >
      {/* Date header */}
      <p className="mb-2 font-semibold">{displayLabel}</p>

      {/* Metric rows with context-aware formatting */}
      {payload.map((entry, index) => {
        const formattedValue = formatCompactCurrency(entry.value)

        return (
          // Note: Using index as key (React anti-pattern) because payload order
          // is stable within a single tooltip render. No add/remove/reorder happens.
          // Alternative: entry.dataKey as key would work but adds unnecessary coupling.
          <div
            key={index}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">{entry.name}:</span>
            </div>
            <span className="text-sm font-semibold">{formattedValue}</span>
          </div>
        )
      })}
      <div className="border-base-content/20 my-2 border-t" />

      {/* Tooltip-only metrics with formatting */}
      {volumeToTvlRatio != null && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Vol/TVL Ratio:</span>
          </div>
          <span className="text-sm font-semibold">{volumeToTvlRatio.toFixed(1) + 'x'}</span>
        </div>
      )}

      {feesUSD != null && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Fees:</span>
          </div>
          <span className="text-sm font-semibold">{formatCompactCurrency(feesUSD)}</span>
        </div>
      )}
    </div>
  )
}
