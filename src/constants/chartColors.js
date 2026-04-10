/**
 * Centralized color palette for Recharts.
 *
 * Architecture Decision: DaisyUI theme colors use oklch() values directly —
 * SVG supports oklch() natively but not CSS var() in fill/stroke attributes.
 * Non-theme values (grid, axis, tooltip) use hex.
 *
 * Color Mapping to DaisyUI theme tokens:
 * - primary   -> --color-error   (assumed price reference line)
 * - secondary -> --color-success (range boundary reference lines)
 * - dataViz.tvl / .volume / .price -> --color-primary
 *
 * @constant {Object} CHART_COLORS
 * @property {string} primary - Assumed price reference line color
 * @property {string} secondary - Range boundary reference lines color
 * @property {string} grid - Chart grid line color
 * @property {string} axis - Axis label color
 * @property {Object} dataViz - Per-metric data colors
 * @property {Object} tooltip - Tooltip container styling
 */
export const CHART_COLORS = {
  primary: 'oklch(0.63 0.22 15)', // --color-error
  secondary: 'oklch(0.7273 0.1429 170.56)', // --color-success

  grid: 'oklch(0.2486 0.041 271.04)',
  axis: 'oklch(0.7107 0.0351 256.79)',

  dataViz: {
    liquidity: 'oklch(0.50 0.26 280)', // --color-secondary
    tvl: 'oklch(0.5854 0.2041 277.12)', // --color-primary
    volume: 'oklch(0.5854 0.2041 277.12)', // --color-primary
    price: 'oklch(0.5854 0.2041 277.12)' // --color-primary
  },

  trend: {
    up: 'oklch(0.7273 0.1429 170.56)', // --color-success
    down: 'oklch(0.63 0.22 15)', // --color-error
    flat: 'oklch(0.5544 0.0407 257.42)' // neutral gray
  },

  tooltip: {
    bg: 'oklch(0.2035 0.0377 266.94)',
    border: 'oklch(0.2882 0.0525 265.09)',
    text: 'oklch(0.9288 0.0126 255.51)'
  }
}
