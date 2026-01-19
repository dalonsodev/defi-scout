/**
 * Uniswap V3 tick math utilities
 * Reference: https://docs.uniswap.org/contracts/v3/reference/core/libraries/TickMath
 */

// Uniswap V3 tick limits
const MIN_TICK = -887272
const MAX_TICK = 887272

/**
 * Mapping from fee tier (in hundreds of bps) to tick spacing
 * @type {Object.<number, number>}
 */
const FEE_TIER_TO_TICK_SPACING = {
   100: 1,      // 0.01% fee
   500: 10,     // 0.05% fee
   3000: 60,    // 0.30% fee
   10000: 200   // 1.00% fee
}

/**
 * Convert price to tick index
 * @param {number} price - Price value (token1/token0)
 * @returns {number} - Tick index
 */
export function priceToTick(price) {
   if (price <= 0) return MIN_TICK

   // Formula: tick = floor(log(price) / log(1.0001))
   const tick = Math.floor(Math.log(price) / Math.log(1.0001))

   // Clamp to valid range
   return Math.max(MIN_TICK, Math.min(MAX_TICK, tick))
}

/**
 * Convert tick index to price
 * @param {number} tick - Tick index
 * @returns {number} - Price value
 */
export function tickToPrice(tick) {
   // Formula: price = 1.0001^tick
   return Math.pow(1.0001, tick)
}

/**
 * Get tick spacing for a given fee tier
 * @param {number} feeTier - Fee tier (100, 500, 3000 or 10000)
 * @returns {number} - Tick spacing
 */
export function getTickSpacing(feeTier) {
   return FEE_TIER_TO_TICK_SPACING[feeTier] || 60 // Default to 0.3% spacing
}

/**
 * Round tick to nearest valid tick based on spacing
 * @param {number} tick - Raw tick
 * @param {number} tickSpacing - Tick spacing for the pool
 * @returns {number} - Aligned tick
 */
export function alignTickToSpacing(tick, tickSpacing) {
   return Math.round(tick / tickSpacing) * tickSpacing
}

/**
 * Increment price by N tick spacings
 * @param {number} currentPrice - Current price
 * @param {number} feeTier - Pool fee tier (100, 500, 30000, 10000)
 * @param {number} direction - 1 for increment, -1 for decrement
 * @returns {number} New price
 */
export function incrementPriceByTick(currentPrice, feeTier, direction = 1) {
   const tickSpacing = getTickSpacing(feeTier)
   const currentTick = priceToTick(currentPrice)
   
   // Align to nearest valid tick first (hanldes manual input edge cases)
   const alignedTick = alignTickToSpacing(currentTick, tickSpacing)
   
   // Move by one spacing unit
   const newTick = alignedTick + (direction * tickSpacing)
   
   // Clamp and convert back to price
   const clampedTick = Math.max(MIN_TICK, Math.min(MAX_TICK, newTick))
   return tickToPrice(clampedTick)
}