import { CHART_COLORS } from "../../../constants/chartColors"
import { formatTickPrice } from "./utils/formatTickPrice"

/**
 * UI: Liquidity Distribution Tooltip (Recharts Custom Component)
 *
 */
export function CustomLiquidityTooltip({
  active,
  payload,
  tokenSymbols,
  selectedTokenIdx
}) {
  if (!active || !payload?.length) return null

  const [token0Symbol, token1Symbol] = tokenSymbols
  const entry = payload[0]

  const price = entry.payload.price
  const label = selectedTokenIdx === 0
    ? `${token0Symbol} per ${token1Symbol}`
    : `${token1Symbol} per ${token0Symbol}`

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
          <span className="text-sm font-semibold">{formatTickPrice(price)}</span>
          <span className="text-xs text-base-content/70 ml-1">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}
