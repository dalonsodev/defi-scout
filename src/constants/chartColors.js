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
 * - dataViz.fees                   -> --color-success
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
  primary:   'oklch(0.63 0.22 15)',    // --color-error
  secondary: 'oklch(0.67 0.18 162)',   // --color-success

  grid: '#1a2035',
  axis: '#94a3b8',

  dataViz: {
    tvl:    'oklch(0.56 0.22 264)',    // --color-primary
    volume: 'oklch(0.56 0.22 264)',    // --color-primary
    fees:   'oklch(0.67 0.18 162)',    // --color-success
    price:  'oklch(0.56 0.22 264)',    // --color-primary
  },

  tooltip: {
    bg:     '#0f1628',
    border: '#1e2a45',
    text:   '#e2e8f0'
  }
}
