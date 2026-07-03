import type { RawToken } from "../../../../types"

const STABLES = ['USDT', 'USDC', 'DAI', 'USDe', 'PYUSD', 'FDUSD', 'USDS']

/**
 * Utility: Token USD Price Calculation via Uniswap Oracle
 *
 * Method: Uses derivedETH (TWAP oracle) × current ETH/USD price.
 * Eliminates algebraic inference (previous approach had 50/50 balance assumption).
 *
 * Fallback Strategy:
 * 1. Primary: derivedETH × ethPriceUSD (works for 99% pools)
 * 2. Secondary: Stablecoin heuristic (if derivedETH missing)
 * 3. Tertiary: Return [0, 0] and log warning
 *
 * @param token0 - Token0 metadata from TheGraph
 * @param token0.derivedETH - Token price in ETH
 * @param token0.symbol - For stablecoin detection
 * @param token1 - Token1 metadata
 * @param ethPriceUSD - Current ETH/USD price from bundle
 * @param currentPrice - Pool price ratio (fallback only)
 *
 * @returns Object containing the price of both tokens in USD
 */
export function calculateTokenPrices(
  token0: RawToken,
  token1: RawToken,
  ethPriceUSD: number,
  currentPrice: number
) {
  // Parse oracle data
  const derivedETH0 = parseFloat(token0.derivedETH || '0')
  const derivedETH1 = parseFloat(token1.derivedETH || '0')

  // ===== PRIMARY METHOD: Oracle-based =====
  if (derivedETH0 > 0 && derivedETH1 > 0 && ethPriceUSD > 0) {
    return {
      token0PriceUSD: derivedETH0 * ethPriceUSD,
      token1PriceUSD: derivedETH1 * ethPriceUSD
    }
  }

  // ===== FALLBACK: Stablecoin Heuristic =====
  const token0IsStable = STABLES.includes(token0.symbol)
  const token1IsStable = STABLES.includes(token1.symbol)

  if (token1IsStable && currentPrice > 0) {
    return {
      token0PriceUSD: currentPrice,
      token1PriceUSD: 1
    }
  }

  if (token0IsStable && currentPrice > 0) {
    return {
      token0PriceUSD: 1,
      token1PriceUSD: 1 / currentPrice
    }
  }

  // ===== FAILURE: No viable method =====
  console.warn('[calculateTokenPrices] All methods failed', {
    token0: token0.symbol,
    token1: token1.symbol,
    derivedETH0,
    derivedETH1,
    ethPriceUSD
  })

  return { token0PriceUSD: 0, token1PriceUSD: 0 }
}
