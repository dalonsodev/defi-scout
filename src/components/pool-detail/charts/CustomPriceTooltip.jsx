import { CHART_COLORS } from '../../../constants/chartColors'

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
 * @param {Object} props - Recharts tooltip props (auto-injected)
 * @param {boolean} props.active - Visibility state (mouse hover)
 * @param {Array} props.payload - Data points at cursor position
 * @param {string} props.label - X-axis value (formatted date)
 * @param {string[]} props.tokenSymbols - [token0Symbol, token1Symbol] tuple
 * @param {number} props.selectedTokenIdx - Base token index (0 or 1)
 * @returns {JSX.Element|null} Tooltip or null if inactive
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
  selectedTokenIdx
}) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const price = entry.value

  // Domain Logic: Resolve pair direction based on selected token
  // selectedTokenIdx=0 => "token0 per token1" (e.g. "WETH per USDC")
  // selectedTokenIdx=1 => "token1 per token0" (e.g. "USDC per WETH")
  const selectedSymbol = tokenSymbols[selectedTokenIdx]
  const oppositeSymbol = tokenSymbols[selectedTokenIdx === 0 ? 1 : 0]

  // Precision: 8 decimals for micro-prices (<$1), 2 for readability (≥$1)
  const formattedPrice = price < 1 ? price.toFixed(8) : price.toFixed(2)

  return (
    <div
      className="rounded-lg p-3 shadow-lg border"
      style={{
        backgroundColor: CHART_COLORS.tooltip.bg,
        borderColor: CHART_COLORS.tooltip.border,
        color: CHART_COLORS.tooltip.text
      }}
    >
      <p className="font-semibold mb-2">{label}</p>

      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <div>
          <span className="text-sm font-semibold">{formattedPrice}</span>
          <span className="text-xs text-base-content/70 ml-1">
            {selectedSymbol} per {oppositeSymbol}
          </span>
        </div>
      </div>
    </div>
  )
}
