import { CHART_COLORS } from '../../../constants/chartColors'
import { formatCompactCurrency } from '../../../utils/formatCompactCurrency'

/**
 * UI: Multi-Series Chart Tooltip (TVL + Volume + APY)
 *
 * Architecture: Reusable tooltip for PoolCharts displaying 3 metric types:
 * 1. Currency (TVL, Volume, Fees) => formatCompactCurrency ($1.2M)
 * 2. Ratio (Volume/TVL) => .toFixed(1) for clean decimal (0.5x vs $0.50)
 * 3. Percentage (APY) => .toFixed(1) + "%" for consistency (12.3%)
 *
 * Design Decision: Used by TVLVolumeChart and FeesApyChart. Recharts auto-injects
 * "payload" array with all active data series at cursor position. Each entry has:
 * { name, value, color, datakey }
 *
 * @param {Object} props - Recharts tooltip props (auto-injected)
 * @param {boolean} props.active - Visibility state (mouse hover)
 * @param {Array} props.payload - Active data series at cursor
 * @param {Object} props.payload[].entry - Single metric data
 * @param {string} props.payload[].name - Display label (e.g. "TVL")
 * @param {number} props.payload[].value - Raw numeric value
 * @param {string} props.payload[].color - Hex color for legend dot
 * @param {string} props.payload[].dataKey - Field name for formatting logic
 * @param {string} props.label - X-axis value (formatted date)
 * @returns {JSX.Element|null} Tooltip or null if inactive
 *
 * @example
 * // Example payload from TVLVolumeChart:
 * // [
 * //   { name: "TVL", value: 1234567, color: "#8b5cf6", dataKey: "tvlUSD" },
 * //   { name: "Volume", value: 89000, color: "#3b82f6", dataKey: "volumeUSD" },
 * //   { name: "Vol/TVL", value: 0.072, color: "#10b981", dataKey: "volumeToTvlRatio" }
 * // ]
 */
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

      {/* Metric rows with context-aware formatting */}
      {payload.map((entry, index) => {
        let formattedValue

        // Format Logic: dataKey determines display style
        if (entry.dataKey === 'volumeToTvlRatio') {
          // Ratio: Show clean decimal (0.5x not $0.50)
          formattedValue = entry.value.toFixed(1)
        } else if (entry.dataKey === 'apy') {
          // Percentage: 1 decimal for consistency (12.3% not 12.34%)
          formattedValue = `${entry.value.toFixed(1)}%`
        } else {
          // Currency: Compact format ($1.2M not $1,200,000)
          formattedValue = formatCompactCurrency(entry.value)
        }

        return (
          // Note: Using index as key (React anti-pattern) because payload order
          // is stable within a single tooltip render. No add/remove/reorder happens.
          // Alternative: entry.dataKey as key would work but adds unnecessary coupling.
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
