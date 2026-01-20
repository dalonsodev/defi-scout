/**
 * Calculate Impermanent Loss using AMM formula
 * @param {number} initialPrice - Starting price ratio
 * @param {number} finalPrice - Ending price ratio
 * @returns {number} IL as decimal (e.g. -0.057 = -5.7% loss)
 */
export function calculateIL(initialPrice, finalPrice) {
   if (initialPrice <= 0 || finalPrice <= 0) {
      throw new Error("Prices must be positive")
   }

   const priceRatio = finalPrice / initialPrice

   // Classic IL formula: 2 x √(ratio) / (1 + ratio) - 1
   const IL_decimal = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1

   return IL_decimal
}