import {
  priceToTick,
  alignTickToSpacing,
  getTickSpacing
} from '../components/pool-detail/calculator/utils/uniswapV3Ticks'

const MIN_TICK = -887272
const MAX_TICK = 887272

/**
 * Utility: Builds a URL to auto-populate a Uniswap V3 position creation form.
 *
 * @param {Object} pool - Pool data from TheGraph (token ids, chain, feeTier)
 * @param {Object} inputs - User-defined range state (fullRange, minPrice, maxPrice, assumedPrice)
 * @param {Object|null} [composition] - Token split from simulation pipeline (null during computation)
 * @param {number} selectedTokenIdx - Active token perspective (0=token0, 1=token1)
 * @returns {string} URL to create a Uniswap V3 position
 */
export function buildUniswapPositionUrl(
  pool,
  inputs,
  composition,
  selectedTokenIdx
) {
  const token0Address = pool.token0.id.toLowerCase()
  const token1Address = pool.token1.id.toLowerCase()

  const decimals0 = Number(pool.token0.decimals)
  const decimals1 = Number(pool.token1.decimals)
  const decimalAdjustment = Math.pow(10, decimals1 - decimals0)

  const tickSpacing = getTickSpacing(pool.feeTier)
  const priceInverted = selectedTokenIdx === 0

  let minTick, maxTick

  if (inputs.fullRange) {
    minTick = Math.ceil(MIN_TICK / tickSpacing) * tickSpacing
    maxTick = Math.floor(MAX_TICK / tickSpacing) * tickSpacing
  } else {
    const canonicalMin =
      selectedTokenIdx === 1 ? 1 / inputs.maxPrice : inputs.minPrice
    const canonicalMax =
      selectedTokenIdx === 1 ? 1 / inputs.minPrice : inputs.maxPrice

    const canonicalMinTick = alignTickToSpacing(
      priceToTick(decimalAdjustment / canonicalMax),
      tickSpacing
    )
    const canonicalMaxTick = alignTickToSpacing(
      priceToTick(decimalAdjustment / canonicalMin),
      tickSpacing
    )

    if (priceInverted) {
      minTick = -canonicalMaxTick
      maxTick = -canonicalMinTick
    } else {
      minTick = canonicalMinTick
      maxTick = canonicalMaxTick
    }
  }

  const fee = JSON.stringify({
    feeAmount: pool.feeTier,
    tickSpacing
  })

  const priceRangeState = JSON.stringify({
    priceInverted,
    fullRange: !!inputs.fullRange,
    minTick,
    maxTick,
    initialPrice: inputs.fullRange ? '' : String(inputs.assumedPrice),
    inputMode: 'price'
  })

  const depositState = JSON.stringify({
    isInternal: false,
    exactField: 'TOKEN0',
    exactAmounts: composition
      ? {
          TOKEN0: isFinite(composition.amount0)
            ? composition.amount0.toFixed(8)
            : '0',
          TOKEN1: isFinite(composition.amount1)
            ? composition.amount1.toFixed(8)
            : '0'
        }
      : {}
  })

  const [c0, c1] =
    token0Address < token1Address
      ? [token0Address, token1Address]
      : [token1Address, token0Address]

  const params = new URLSearchParams()
  params.set('currencyA', c0)
  params.set('currencyB', c1)
  params.set('chain', 'ethereum')
  params.set('fee', fee)
  params.set('hook', 'undefined')
  params.set('priceRangeState', priceRangeState)
  params.set('depositState', depositState)

  return `https://app.uniswap.org/positions/create/v3?${params.toString()}`
}
