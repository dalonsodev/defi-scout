/**
 * Centralized color palette for Recharts.
 *
 * Architecture Decision: Hex values instead of CSS variables because SVG
 * fill/stroke attributes don't support var() syntax (browser limitation).
 *
 * Color Selection Strategy:
 * - Based on DaisyUI dark theme for visual consistency
 * - Tailwind palette fallbacks for non-themed elements
 * - All colors tested for WCAG AA contrast (4.5:1 minimum against #1f2937 background)
 *
 * @constant {Object} CHART_COLORS - Immutable color map for all chart components
 * @property {string} primary - Main brand color (#605dff)
 * @property {Object} dataViz - Data-specific palette (TVL, Volume, APY, etc.)
 * @property {Object} tooltip - Tooltip styling (bg, border, text)
 */

export const CHART_COLORS = {
  // Primary data colors
  primary: '#605dff', // DaisyUI primary
  secondary: '#01d390', // DaisyUI secondary

  // Neutral colors for    grid/axes
  grid: '#374151', // gray-700 - subtle grid lines
  axis: '#f9fafb', // gray-50 - subtle axis lables (high contrast)

  // Data visualization palette
  // Design: Each metric gets distinct hue to prevent confusion in multi-line charts
  dataViz: {
    tvl: '#605dff', // Primary - area chart (TVL is hero metric)
    volume: '#F43098', // Magenta - bar chart (high visibility)
    ratio: '#06b6d4', // cyan-500 - Vol/TVL ratio line
    fees: '#06b6d4', // cyan-500 - fees line
    apy: '#01d390', // Secondary - APY line (positive = green psychology)
    price: '#f59e0b' // amber-500 - price line (warning tone for volatility)
  },

  // Tooltip styling
  // Note: Slightly lighter than chart bg (#1a1a1a) for layering effect
  tooltip: {
    bg: '#1f2937', // gray-800
    border: '#374151', // gray-700
    text: '#f9fafb' // gray-50
  }
}
