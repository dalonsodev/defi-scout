import { ReactNode } from 'react'
import { CHART_COLORS } from '../../../constants/chartColors'
import type { TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

interface CustomPriceTooltipProps extends Partial<TooltipContentProps<ValueType, NameType>> {
  tokenSymbols: [string, string]
  selectedTokenIdx: number
  dateShortMap: Map<number, string>
}

/**
 * UI: Price Ratio Tooltip (Recharts Custom Component)
 *
 * Architecture: Handles dynamic token pair display based on user toggle.
 * Unlike CustomTooltip (multi-metric), this specializes in price ratios with
 * high precision for low-value pairs (e.g. SHIB/USDC at 0.00001234).
 *
 * Design Decision: Hex colors (CHART_COLORS) instead of CSS variables because
 * SVG fill/stroke don't support var(--color-name). Documented in chartColors.js.
 *
 * Precision Logic: Small prices (<$1) use 8 decimals to avoid "0.00" display
 * for micro-cap tokens. Large prices use 2 decimals for readability.
 * Trade-offs: 8 decimals can look cluttered, but financial accuracy > aesthetics.
 *
 * @param props - Recharts tooltip props (auto-injected)
 * @param props.active - Visibility state (mouse hover)
 * @param props.payload - Data points at cursor position
 * @param props.label - X-axis value (formatted date)
 * @param props.tokenSymbols - [token0Symbol, token1Symbol] tuple
 * @param props.selectedTokenIdx - Base token index (0 or 1)
 * @param props.dateShortMap - Resolves dateTimestamp -> dateShort
 * @returns Tooltip or null if inactive
 *
 * @example
 * // When selectedTokenIdx = 0:
 * // Shows "1.2345 WETH per USDC" (token0Price)
 * // When selectedTokenIdx = 1:
 * // Shows "0.00081 USDC per WETH" (1/token1Price from PriceChart calculation)
 */
export function CustomPriceTooltip({
  active,
  payload,
  label,
  tokenSymbols,
  selectedTokenIdx,
  dateShortMap
}: CustomPriceTooltipProps): ReactNode | null {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const rawData = entry.payload as { value: number }
  const price = rawData.value

  // Domain Logic: Resolve pair direction based on selected token
  // selectedTokenIdx=0 => "token0 per token1" (e.g. "WETH per USDC")
  // selectedTokenIdx=1 => "token1 per token0" (e.g. "USDC per WETH")
  const selectedSymbol = tokenSymbols[selectedTokenIdx]
  const oppositeSymbol = tokenSymbols[selectedTokenIdx === 0 ? 1 : 0]

  // Precision: 8 decimals for micro-prices (<$1), 2 for readability (≥$1)
  const formattedPrice = price < 1 ? price.toFixed(8) : price.toFixed(2)

  const labelAsNumber = typeof label === 'string' ? Number(label) : (label as number)
  const displayLabel = dateShortMap?.get(labelAsNumber) ?? String(label ?? '')

  return (
    <div
      className="rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor: CHART_COLORS.tooltip.bg,
        borderColor: CHART_COLORS.tooltip.border,
        color: CHART_COLORS.tooltip.text
      }}
    >
      <p className="mb-2 font-semibold">{displayLabel}</p>

      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <div>
          <span className="text-sm font-semibold">{formattedPrice}</span>
          <span className="text-base-content/70 ml-1 text-xs">
            {selectedSymbol} per {oppositeSymbol}
          </span>
        </div>
      </div>
    </div>
  )
}
