/**
 * Utility: Calculates min/max price range based on preset volatility brackets.
 * 
 * Design Decision: Offers 3 tiers (±10%, ±15%, ±20%) matching Uniswap's default UI.
 * Rationale: These percentages balance fee capture vs IL risk for typical LP strategies:
 * 1. ±10%: Conservative (stablecoin pairs, low volatility assets)
 * 2. ±15%: Moderate (ETH/BTC pairs with medium volatility)
 * 3. ±20%: Aggressive (high-volume altcoins, accepts higher IL for more fees)
 * 
 * Model Simplification: Uses linear offsets (price × 1.1) instead of geometric ranges.
 * Limitation: Creates asymmetric IL - e.g. ±10% range has different loss at minPrice vs maxPrice.
 * Accuracy: Good enough for UI quickstart; advanced users should use custom ranges.
 * 
 * @param {number} assumedPrice - Reference price (usually current market price from pool.token0Price)
 * @param {string} presetType - Preset identifier "±10%" | "±15%" | "±20%"
 * @returns {{ minPrice: string, maxPrice: string }} Formatted price boundaries as strings (HTML input compatible)
 * 
 * @example
 * const { minPrice, maxPrice } = calculatePresetRange(2000, "±10%")
 * // Returns { minPrice: "1800.00000000", maxPrice: "2200.00000000"}
 */
export function calculatePresetRange(assumedPrice, presetType) {
   /**
    * Predefined Volatility Brackets:
    * These multipliers represent the "width" of the concentrated liquidity position.
    * Chosen to match Uniswap's default options in their official interface.
    */
   const MULTIPLIERS = {
      "±10%": { min: 0.9, max: 1.1 },     // Low-risk: Stablecoin pairs
      "±15%": { min: 0.85, max: 1.15 },   // Medium: Major pairs (ETH/USDC)
      "±20%": { min: 0.8, max: 1.2 },     // High-risk: Volatile altcoins
   }

   const { min, max } = MULTIPLIERS[presetType]

   /**
    * Calculation & Normalization:
    * .toFixed(8) ensures the resulting STRING is compatible with HTML <input type="number">
    * and avoids floating-point precision artifacts (e.g. 1800.0000000001 → "1800.00000000").
    * Note: We convert back from number to string intentionally (inputs require string values).
    */
   const minPrice = (assumedPrice * min).toFixed(8)
   const maxPrice = (assumedPrice * max).toFixed(8)

   return { minPrice, maxPrice }
}
