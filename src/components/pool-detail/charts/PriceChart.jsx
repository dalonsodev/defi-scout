import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   ReferenceLine
} from "recharts"
import { CustomPriceTooltip } from "./CustomPriceTooltip"
import { CHART_COLORS } from "../../../constants/chartColors"
import { formatCompactCurrency } from "../../../utils/formatCompactCurrency"

/**
 * UI: Strategic Price & Range Chart.
 * Visualizes asset price trends against liquidity provider boundaries.
 * @param {Object} props
 * @param {Array<Object>} props.history - Timeseries data from the pool API
 * @param {number} props.selectedTokenIdx - Index of the token used as base price (0 or 1)
 * @param {string[]} props.tokenSymbols - Tuple of token symbols [Symbol0, Symbol1]
 * @param {Object} props.rangeInputs - Current simulation range (minPrice, maxPrice, assumedPrice)
 * @param {number} props.currentPrice - Live market price for the asset
 * @returns {JSX.Element}
 */
export function PriceChart({ 
   history, 
   selectedTokenIdx, 
   tokenSymbols,
   rangeInputs,
   currentPrice
}) {
   const dataKey = selectedTokenIdx === 0 ? "token0Price" : "token1Price"
   const selectedSymbol = tokenSymbols[selectedTokenIdx]
   
   return (
      <div className="card bg-base-200 rounded-2xl">
         <h3 className="text-lg font-semibold mb-4">
            Price - {selectedSymbol}
         </h3>

         <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
            <LineChart data={history}>
               <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />

               <XAxis 
                  dataKey="dateShort"
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "10px" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
               />

               <YAxis 
                  stroke={CHART_COLORS.axis}
                  style={{ fontSize: "11px" }}
                  domain={[
                     (dataMin) => dataMin * 0.9,
                     (dataMax) => dataMax * 1.1
                  ]}
                  tickFormatter={(value) => (
                     value > 1
                        ? formatCompactCurrency(value)
                        : value.toFixed(6)
                  )}
               />

               <Line 
                  type="monotone"
                  dataKey={dataKey}
                  stroke={CHART_COLORS.dataViz.price}
                  strokeWidth={2}
                  dot={false}
                  name={`${selectedSymbol} Price`}
               />

               {currentPrice > 0 && (
                  <ReferenceLine
                     y={!rangeInputs.fullRange ? rangeInputs.assumedPrice : currentPrice}
                     stroke={CHART_COLORS.primary}
                     strokeDasharray="5 5"
                  />
               )}

               {/* Concentrated Liquidity Bounds:
                  Visualizes the "ticks" where the user's capital is active
                  Hidden if "full range" is active as boundaries woud be effectively [0, ∞]
               */}
               {!rangeInputs.fullRange && (
                  <>
                     <ReferenceLine 
                        y={rangeInputs.minPrice}
                        stroke={CHART_COLORS.secondary}
                        strokeDasharray="5 5"
                     />
                     <ReferenceLine 
                        y={rangeInputs.maxPrice}
                        stroke={CHART_COLORS.secondary}
                        strokeDasharray="5 5"
                     />
                  </>
               )}

               <Tooltip content={
                  <CustomPriceTooltip 
                     tokenSymbols={tokenSymbols}
                     selectedTokenIdx={selectedTokenIdx}
                  />
               } />
            </LineChart>
         </ResponsiveContainer>
      </div>
   )
}
