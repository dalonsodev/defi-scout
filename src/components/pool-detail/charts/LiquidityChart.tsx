import { useMemo } from 'react'
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS } from '../../../constants/chartColors'
import { CustomLiquidityTooltip } from './CustomLiquidityTooltip'
import { processTickData } from './utils/processTickData'
import type { ReactNode } from 'react'
import type { AxisDomain } from 'recharts/types/util/types'
import type { PoolTickResult, UserInputs } from '../../../types'

interface LiquidityChartProps {
  selectedTokenIdx: number
  tokenSymbols: [string, string]
  token0Decimals: number
  token1Decimals: number
  rangeInputs: Pick<UserInputs, 'minPrice' | 'maxPrice' | 'assumedPrice' | 'fullRange'>
  currentPrice: number
  tickData: PoolTickResult
  tickError: string | null
}

/**
 * UI: Liquidity Distribution Chart
 * Visualizes liquidity distribution for the pool against LP boundaries.
 *
 * @param selectedTokenIdx - Index of token used for base price (0 or 1)
 * @param tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param token0Decimals - Amount of decimals for token0
 * @param token1Decimals - Amount of decimals for token1
 * @param rangeInputs - User selected (minPrice, maxPrice, assumedPrice)
 * @param currentPrice - Current active price
 * @param tickData - Collection of ticks for the current pool
 * @param tickError - From fetching ticks via usePoolTickData()
 * @param isLoading - Active computation state
 */
export function LiquidityChart({
  selectedTokenIdx,
  tokenSymbols,
  token0Decimals,
  token1Decimals,
  rangeInputs,
  currentPrice,
  tickData,
  tickError
}: LiquidityChartProps): ReactNode | null {
  const processedData = useMemo(() => {
    return processTickData(tickData, selectedTokenIdx, token0Decimals, token1Decimals)
  }, [tickData, selectedTokenIdx, token0Decimals, token1Decimals])

  const yDomain = useMemo(() => {
    if (!processedData?.length) return [0, 'auto'] as AxisDomain

    const sorted = [...processedData].sort((a, b) => a.liquidity - b.liquidity)
    const p95 = sorted[Math.floor(sorted.length * 0.95)]

    return [0, p95.liquidity * 1.1] as AxisDomain // 10% headroom above 95th percentile
  }, [processedData])

  const referencePoints = useMemo(() => {
    if (!processedData?.length) return {}

    const nearest = (target: number) => {
      return processedData.reduce((best, item) =>
        Math.abs(item.price - target) < Math.abs(best.price - target) ? item : best
      ).price
    }

    return {
      assumed: nearest(Number(rangeInputs.assumedPrice || currentPrice)),
      min: nearest(Number(rangeInputs.minPrice)),
      max: nearest(Number(rangeInputs.maxPrice))
    }
  }, [processedData, rangeInputs, currentPrice])

  if (tickError || !processedData?.length) return null

  return (
    <div className="card glass-surface rounded-2xl p-4">
      <h3 className="mb-4 text-lg font-semibold">Liquidity Distribution</h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
        <BarChart
          data={processedData}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="price"
            type="category"
            hide
          />
          <YAxis
            hide
            domain={yDomain}
          />

          {currentPrice > 0 && (
            <ReferenceLine
              x={referencePoints.assumed}
              stroke={CHART_COLORS.primary}
              strokeDasharray="5 5"
            />
          )}

          {!rangeInputs.fullRange && (
            <>
              <ReferenceLine
                x={referencePoints.min}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
              />
              <ReferenceLine
                x={referencePoints.max}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
              />
            </>
          )}

          <Tooltip
            content={
              <CustomLiquidityTooltip
                tokenSymbols={tokenSymbols}
                selectedTokenIdx={selectedTokenIdx}
              />
            }
          />
          <Bar
            dataKey="liquidity"
            fill={CHART_COLORS.dataViz.tvl}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
