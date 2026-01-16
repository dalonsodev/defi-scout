/**
 * Calculates min/max price range based on preset type
 * @param {number} assumedPrice - Base price to calculate from
 * @param {string} presetType - "±10%" | "±20%" | "fullRange"
 * @returns {{ minPrice: number, maxPrice: number }}
 */
export function calculatePresetRange(assumedPrice, presetType) {
   const multipliers = {
      "±10%": { min: 0.9, max: 1.1 },
      "±15%": { min: 0.85, max: 1.15 },
      "±20%": { min: 0.8, max: 1.2 },
   }

   const { min, max } = multipliers[presetType]

   const minPrice = (assumedPrice * min).toFixed(8)
   const maxPrice = (assumedPrice * max).toFixed(8)

   return { minPrice, maxPrice }
}