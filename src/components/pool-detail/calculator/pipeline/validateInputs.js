/**
 * Pipeline Stage: Validates inputs for LP position.
 * 
 * @param {Object} params - User-defined inputs + hour snapshots from TheGraph
 * @param {number} params.capitalUSD - Actual investment in USD (min $10)
 * @param {number} params.minPrice - Lower price bound (in selected token scale)
 * @param {number} params.maxPrice - Upper price bound (in selected token scale)
 * @param {boolean} params.fullRange - Whether it is a full range position
 * @param {number} params.assumedPrice - Entry price for concentrated positions
 * @param {number} params.selectedTokenIdx - 0 or 1, defines price scale interpretation
 * @param {Object[]} params.hourlyData - TheGraph poolHourData snapshots
 * 
 * @returns {{success: boolean, error?: string}} Returns either success state if all inputs valid or failure state if not (with error string)
 */
export function validateInputs({
   capitalUSD,
   minPrice,
   maxPrice,
   fullRange,
   assumedPrice,
   selectedTokenIdx,
   hourlyData
}) {
   if (typeof capitalUSD !== "number" || isNaN(capitalUSD) || capitalUSD < 10) {
      return { success: false, error: "Capital must be at least $10"}
   }

   if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
      return { success: false, error: "You must select a token"}
   }

   const isEmpty = (value) => value === "" || value == null
   
   if (!fullRange) {
      if (isEmpty(minPrice) || isEmpty(maxPrice)) {
         return { 
            success: false, 
            error: "Price range required when Full Range is off" 
         }
      }

      const minNum = Number(minPrice)
      const maxNum = Number(maxPrice)
      
      if (!isFinite(minNum) || !isFinite(maxNum) || minNum <= 0 || maxNum <= 0) {
         return {
            success: false,
            error: "Prices must be positive"
         }
      }
      if (minNum >= maxNum) {
         return { 
            success: false, 
            error: "Min Price must be lower than Max Price" 
         }
      }
      if (assumedPrice === "" || assumedPrice == null) {
         return {
            success: false,
            error: "Assumed Entry Price required when full range is off"
         }
      }

      const assumedNum = Number(assumedPrice)
      if (!isFinite(assumedNum) || assumedNum <= 0) {
         return {
            success: false,
            error: "Assumed Entry Price must be positive"
         }
      }
   }

   if (!hourlyData?.length || hourlyData.length < 168) {
      return { success: false, error: "No hourly data" }
   }

   return { success: true }
}
