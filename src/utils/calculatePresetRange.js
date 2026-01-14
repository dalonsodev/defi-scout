/**
 * Calculates min/max price range based on preset type
 * @param {number} currentPrice - Base price to calculate from
 * @param {number} selectedTokenIdx - 0 for token0, 1 for token1
 * @param {string} presetType - "±10%" | "±20%" | "fullRange"
 * @returns {{ minPrice: number, maxPrice: number }}
 */
export function calculatePresetRange(currentPrice, selectedTokenIdx, presetType) {
   const multipliers = {
      "±10%": { min: 0.9, max: 1.1 },
      "±15%": { min: 0.85, max: 1.15 },
      "±20%": { min: 0.8, max: 1.2 },
   }

   const { min, max } = multipliers[presetType]

   const minPrice = (currentPrice * min).toFixed(8)
   const maxPrice = (currentPrice * max).toFixed(8)

   return { minPrice, maxPrice }
}