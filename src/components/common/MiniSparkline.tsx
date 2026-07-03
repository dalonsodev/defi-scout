import { ReactNode } from 'react'
import { CHART_COLORS } from '../../constants/chartColors'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
}

/**
 * UI: Lightweight Trend Visualizer (Sparkline).
 *
 * Architecture: Pure SVG approach for simplicity over Canvas.
 * Trade-offs: SVG polyline to maintain/debug but Canvas would render faster
 * for >100 points (not needed for our 14-day datasets).
 *
 * Color Coding: Green (bullish), Red (bearish), Gray (neutral) follows universal
 * financial charting conventions (Bloomberg, Yahoo Finance, DeFiLlama)
 *
 * @param props
 * @param props.data - Array of numeric values to plot
 * @param [props.width=80] - SVG width in pixels
 * @param [props.height=40] - SVG height in pixels
 * @returns Inline SVG or fallback state (loading skeleton / "No data")
 *
 * @example
 * // 14-day APY trend
 * <MiniSparkline data={[12.5, 13.1, 12.8, 14.2, 13.9, 14.5, 15.1 ...]} width={80} />
 */
export function MiniSparkline({ data, width = 80, height = 20 }: MiniSparklineProps): ReactNode {
  if (!data)
    return <div className="bg-base-300 h-10 w-20 animate-pulse rounded" />

  if (data.length < 2)
    return (
      <span className="text-base-content/50 text-xs font-medium">No data</span>
    )

  const values = data
  const min = Math.min(...data)
  const max = Math.max(...data)
  const first = values[0]
  const last = values[values.length - 1]

  // Financial convention: Green (gains), Red (losses), Gray (flat)
  const strokeColor =
    last > first
      ? CHART_COLORS.trend.up
      : last < first
        ? CHART_COLORS.trend.down
        : CHART_COLORS.trend.flat

  /**
   * Geometry: Map a numeric value to an SVG Y-coordinate.
   * Note: SVG Y-axis is inverted (0 = top, height = bottom)
   * @param value - Raw data point
   * @returns Pixel coordinate (0 to height)
   */
  function normalizeY(value: number): number {
    // Edge Case: Flat line (prevent division by zero)
    if (max === min) return height / 2

    // Linear interpolation: (value - min) / range * canvas_height
    return height - ((value - min) / (max - min)) * height
  }

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = normalizeY(value)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
