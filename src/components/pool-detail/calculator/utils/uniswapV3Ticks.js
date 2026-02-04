/**
 * Math Library: Uniswap V3 Tick-Price Conversion
 *
 * Protocol Invariant: Ticks are discrete indices used to define price boundaries
 * in concentrated liquidity positions. The price at tick "i" follows:
 *
 *    P(i) = 1.0001^i
 *
 * This creates a geometric scale where each tick represents a 0.01% price change.
 *
 * Key Insight: Tick spacing (granularity) increases with fee tier to prevent
 * excessive gas costs from micro-adjustments in high-fee pools.
 *
 * Reference: https://docs.uniswap.org/contracts/v3/reference/core/libraries/TickMath
 *
 * @module uniswapV3Ticks
 */

// Domain Constants: Harcoded in UniswapV3Pool.sol (smart contract)
// Range corresponds to prices between ~1.0001^-887272 ≈ 0 and 1.0001^887272 = ∞
// These bounds prevent overflow in on-chain sqrt calculations (X96 fixed-point math)
const MIN_TICK = -887272
const MAX_TICK = 887272

/**
 * Fee tier (bps) to tick spacing mapping.
 *
 * Design Rationale: Higher fees = wider spreads = less frequent rebalancing needed
 * → Larger tick spacing reduces gas costs without harming LPs
 *
 * @type {Object.<number, number>}
 * @property {number} 100 - 0.01% fee tier (1 tick spacing, for stablecoin pairs)
 * @property {number} 200 - 0.02% fee tier (4 tick spacing, used in L2s like Arbitrum)
 * @property {number} 500 - 0.05% fee tier (10 tick spacing, most common)
 * @property {number} 3000 - 0.30% fee tier (60 tick spacing, volatile pairs)
 * @property {number} 10000 - 1.00% fee tier (200 tick spacing, exotic pairs, memecoins)
 */
const FEE_TIER_TO_TICK_SPACING = {
  100: 1, // 0.01% fee -> Spacing 1
  200: 4, // 0.02% fee -> Spacing 4
  500: 10, // 0.05% fee -> Spacing 10
  3000: 60, // 0.30% fee -> Spacing 60
  10000: 200 // 1.00% fee -> Spacing 200
}

/**
 * Utility: Convert price (ratio) to the nearest lower tick index.
 *
 * Formula derivation:
 *    P = 1.0001^i
 *    log(P) = i × log(1.0001)
 *    i = log(P) / log(1.0001)
 *
 * Edge Cases:
 * - Negative/zero prices clamp to MIN_TICK (prevents log domain errors)
 * - Prices above MAX_TICK clam to MAX_TICK (prevents overflow)
 *
 * @param {number} price - Price ratio (token1/token0, must be positive)
 * @returns {number} - Tick index (integer in range [MIN_TICK, MAX_TICK])
 *
 * @example
 * // ETH/USDC at $3000
 * priceToTick(3000) // => ~83091
 *
 * @example
 * // Invalid input (defensive clamping)
 * priceToTick(0) // => -887272 (MIN_TICK)
 * priceToTick(Infinity) // => 887272 (MAX_TICK)
 */
export function priceToTick(price) {
  if (price <= 0) return MIN_TICK

  const tick = Math.floor(Math.log(price) / Math.log(1.0001))

  return Math.max(MIN_TICK, Math.min(MAX_TICK, tick))
}

/**
 * Utility: Convert tick index back to a numeric price.
 *
 * @param {number} tick - Tick index (will be clamped to valid range)
 * @returns {number} Price ratio (token1/token0)
 *
 * @example
 * tickToPrice(83091) // => ~3000.00 (ETH/USDC)
 */
export function tickToPrice(tick) {
  // Defensive: Clamping and round to prevent floating-point edge cases
  const clampedTick = Math.max(MIN_TICK, Math.min(MAX_TICK, Math.round(tick)))
  return Math.pow(1.0001, clampedTick)
}

/**
 * Utility: Get protocol-mandated tick spacing for a given fee tier.
 *
 * @param {number} feeTier - Fee tier in basis points (100, 500, 3000, 10000)
 * @returns {number} - Tick spacing (granularity of price grid)
 *
 * @example
 * getTickSpacing(3000) // => 60 (for 0.3% fee tier)
 * getTickSpacing(9999) // => 60 (fallback for unknown tiers)
 */
export function getTickSpacing(feeTier) {
  return FEE_TIER_TO_TICK_SPACING[feeTier] || 60 // Default to 0.3% spacing
}

/**
 * Utility: Aligns a raw tick to the nearest valid protocol boundary.
 *
 * Context: Uniswap V3 only allows liquidity to be provided at ticks that are
 * multiples of spacing. This prevents fragmentation and reduces gas costs.
 *
 * @param {number} tick - Target raw tick (can be any integer)
 * @param {number} tickSpacing - Fee-dependent spacing (from getTickSpacing)
 * @returns {number} - Aligned tick (guaranteed multiple of tickSpacing)
 */
export function alignTickToSpacing(tick, tickSpacing) {
  return Math.round(tick / tickSpacing) * tickSpacing
}

/**
 * Utility: Calculates a new price by shifting the current tick index.
 *
 * Use Case: Implements "+" and "-" buttons in price inputs fields, ensuring
 * each step respects protocol tick spacing (prevents invalid positions)
 *
 * @param {number} currentPrice - Reference price (token1/token0)
 * @param {number} feeTier - Pool fee tier (100, 500, 30000, 10000 bps)
 * @param {number} direction - 1 for increment, -1 for decrement
 * @returns {number} Adjusted price (guaranteed to be on valid tick grid)
 *
 * @example
 * // Increment ETH/USDC price by one 0.3% tick
 * const newPrice = incrementPriceByTick(3000, 3000, 1)
 * // => ~3001.80 (next valid tick at spacing 60)
 *
 * @example
 * // Decrement with boundary clamping
 * incrementPriceByTick(0.0001, 3000, -1) // => tickToPrice(MIN_TICK)
 */
export function incrementPriceByTick(currentPrice, feeTier, direction = 1) {
  const tickSpacing = getTickSpacing(feeTier)
  const currentTick = priceToTick(currentPrice)

  // Normalize to valid grid, then shift by one space unit
  const alignedTick = alignTickToSpacing(currentTick, tickSpacing)
  const newTick = alignedTick + direction * tickSpacing

  // Clamp to protocol bounds (prevents overflow in edge cases)
  const clampedTick = Math.max(MIN_TICK, Math.min(MAX_TICK, newTick))
  return tickToPrice(clampedTick)
}
