import { ReactNode } from 'react'
import { CHART_COLORS } from '../../../constants/chartColors'
import { formatTickPrice } from './utils/formatTickPrice'
import type { TooltipContentProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

interface CustomLiquidityTooltipProps extends Partial<TooltipContentProps<ValueType, NameType>> {
  tokenSymbols: [string, string]
  selectedTokenIdx: number
}

/**
 * UI: Liquidity Distribution Tooltip (Recharts Custom Component)
 *
 */
export function CustomLiquidityTooltip({
  active,
  payload,
  tokenSymbols,
  selectedTokenIdx
}: CustomLiquidityTooltipProps): ReactNode | null {
  if (!active || !payload?.length) return null

  const [token0Symbol, token1Symbol] = tokenSymbols
  const entry = payload[0]
  const rawData = entry.payload as { price: number }
  const price = rawData.price
  const label =
    selectedTokenIdx === 0
      ? `${token0Symbol} per ${token1Symbol}`
      : `${token1Symbol} per ${token0Symbol}`

  return (
    <div
      className="rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor: CHART_COLORS.tooltip.bg,
        borderColor: CHART_COLORS.tooltip.border,
        color: CHART_COLORS.tooltip.text
      }}
    >
      <p className="mb-2 font-semibold">{label}</p>

      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <div>
          <span className="text-sm font-semibold">
            {formatTickPrice(price)}
          </span>
          <span className="text-base-content/70 ml-1 text-xs">{label}</span>
        </div>
      </div>
    </div>
  )
}
