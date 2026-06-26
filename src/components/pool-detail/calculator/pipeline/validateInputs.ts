import type { UserInputs } from "../../../../types"

interface ValidateInputsProps extends UserInputs {
  selectedTokenIdx: number
}

type ValidateInputsResult =
  | { success: true }
  | { success: false, error: string }

/**
 * Pipeline Stage: Validates inputs for LP position.
 *
 * @param props - User-defined inputs for LP position
 * @param props.capitalUSD - Actual investment in USD (min $10)
 * @param props.minPrice - Lower price bound (in selected token scale)
 * @param props.maxPrice - Upper price bound (in selected token scale)
 * @param props.fullRange - Whether it is a full range position
 * @param props.assumedPrice - Entry price for concentrated positions
 * @param props.selectedTokenIdx - 0 or 1, defines price scale interpretation
 *
 * @returns Returns either success state if all inputs valid or failure state if not (with error string)
 */
export function validateInputs({
  capitalUSD,
  minPrice,
  maxPrice,
  fullRange,
  assumedPrice,
  selectedTokenIdx
}: ValidateInputsProps): ValidateInputsResult {
  if (typeof capitalUSD !== 'number' || Number.isNaN(capitalUSD) || capitalUSD < 10) {
    return { success: false, error: 'Capital must be at least $10' }
  }

  if (selectedTokenIdx !== 0 && selectedTokenIdx !== 1) {
    return { success: false, error: 'You must select a token' }
  }

  const isEmpty = (value: string | number | null | undefined) => value === '' || value == null

  if (!fullRange) {
    if (isEmpty(minPrice) || isEmpty(maxPrice)) {
      return {
        success: false,
        error: 'Price range required when Full Range is off'
      }
    }

    const minNum = Number(minPrice)
    const maxNum = Number(maxPrice)

    if (!Number.isFinite(minNum) || !Number.isFinite(maxNum) || minNum <= 0 || maxNum <= 0) {
      return {
        success: false,
        error: 'Prices must be positive'
      }
    }
    if (minNum >= maxNum) {
      return {
        success: false,
        error: 'Min Price must be lower than Max Price'
      }
    }
    if (assumedPrice === '' || assumedPrice == null) {
      return {
        success: false,
        error: 'Assumed Entry Price required when full range is off'
      }
    }

    const assumedNum = Number(assumedPrice)

    if (!Number.isFinite(assumedNum) || assumedNum <= 0) {
      return {
        success: false,
        error: 'Assumed Entry Price must be positive'
      }
    }
    if (assumedNum < minNum || assumedNum > maxNum) {
      return {
        success: false,
        error: 'Assumed Entry Price must be within the min/max price range.'
      }
    }
  }

  return { success: true }
}
