/**
 * Centralized color palette for Recharts
 * Uses hex values (SVG fill/stroke don"t support CSS variables)
 * Based on DaisyUI dark theme + Tailwind palette
 */

export const CHART_COLORS = {
  // Primary data colors
  primary: "#605dff",
  secondary: "#01d390",
  
  // Neutral colors for grid/axes
  grid: "#374151",      // gray-700 - subtle grid lines
  axis: "#f9fafb",      // gray-50 - subtle axis lables
  
  // Data visualization palette
  dataViz: {
    tvl: "#605dff",     // Primary - area chart
    volume: "#F43098",  // Volume-like - bar chart
    ratio: "#06b6d4",   // cyan-500 - Vol/TVL ratio line
    fees: "#06b6d4",    // cyan-500 - fees line
    apy: "#01d390",     // Secondary - APY line
    price: "#f59e0b",   // amber-500 - price line
  },
  
  // Tooltip styling
  tooltip: {
    bg: "#1f2937",      // gray-800
    border: "#374151",  // gray-700
    text: "#f9fafb",    // gray-50
  }
};