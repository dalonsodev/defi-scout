import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { CustomLiquidityTooltip } from './CustomLiquidityTooltip'
import { usePoolTickData } from './hooks/usePoolTickData'
import { processTickData } from './utils/processTickData'
import { CHART_COLORS } from '../../../constants/chartColors'

/**
 * UI: Liquidity Distribution Chart
 * Visualizes liquidity distribution for the pool against LP boundaries.
 *
 * @param {string} poolId - Pool contract address
 * @param {number} currentTick - Current active tick
 * @param {number} feeTier - Pool fee tier (100, 500, 3000, 10000 bps)
 * @param {number} selectedTokenIdx - Index of token used for base price (0 or 1)
 * @param {string[]} tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param {string} token0Decimals - Amount of decimals for token0
 * @param {string} token1Decimals - Amount of decimals for token1
 * @param {{ minPrice, maxPrice, assumedPrice }} rangeInputs - User selected
 *
 * @returns {JSX.Element}
 */
export function LiquidityChart({
  poolId,
  currentTick,
  feeTier,
  selectedTokenIdx,
  tokenSymbols,
  token0Decimals,
  token1Decimals,
  rangeInputs,
  currentPrice
}) {
  const { tickData: data, fetchError } = usePoolTickData(
    poolId,
    currentTick,
    feeTier
  )

  const processedData = useMemo(() => {
    return processTickData(data, selectedTokenIdx, token0Decimals, token1Decimals)
  }, [data, selectedTokenIdx, token0Decimals, token1Decimals])

  const yDomain = useMemo(() => {
    if (!processedData?.length) return [0, 'auto']

    const sorted = [...processedData].sort((a, b) => a.liquidity - b.liquidity)
    const p95 = sorted[Math.floor(sorted.length * 0.95)]

    return [0, p95.liquidity * 1.1] // 10% headroom above 95th percentile
  }, [processedData])

  const referencePoints = useMemo(() => {
    if (!processedData?.length) return {}

    const nearest = (target) => {
      const scaledTarget = 1 / target
      return processedData.reduce((best, item) =>
        Math.abs(item.price - scaledTarget) < Math.abs(best.price - scaledTarget)
        ? item
        : best
      ).price
    }

    return {
      assumed: nearest(rangeInputs.assumedPrice || currentPrice),
      min: nearest(rangeInputs.minPrice),
      max: nearest(rangeInputs.maxPrice)
    }
  }, [processedData, rangeInputs, currentPrice])

  if (fetchError || !processedData?.length) return null

  return (
    <div className="card bg-base-200 rounded-2xl">
      <h3 className="text-lg font-semibold mb-4">Liquidity Distribution</h3>

      <ResponsiveContainer
        width="100%"
        height={window.innerWidth < 768 ? 200 : 300}
      >
        <BarChart
          data={processedData}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis dataKey="price" type="category" hide />
          <YAxis hide domain={yDomain} />

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
                strokeDasharray= "5 5"
              />
              <ReferenceLine
                x={referencePoints.max}
                stroke={CHART_COLORS.secondary}
                strokeDasharray= "5 5"
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
