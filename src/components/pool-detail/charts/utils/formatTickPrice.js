/**
 * Utility: Format prices from tick to currency for charts.
 *
 * Design Decisions:
 *  No "$" prefix, they're denominated in terms of the selected token, not dollars.
 *  No compact abbreviation (K/M) for prices, this might be misleading for the user.
 *
 * Precision:
 *  Optimized for prices >= 1000 (e.g. 2200 -> "2,200.0")
 *  Optimized for prices >= 0.01 (e.g. 0.058 -> "0.0580")
 *  Optimized for prices < 0.01 (e.g. 0.0000345 -> "0.00003450")
 */
export function formatTickPrice(price) {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })
  }

  if (price >= 0.01) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    })
  }

  if (price < 0.01) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    })
  }
}
