// APY Calculation Logic: (Accumulated Fees / Age in Days / TVL) * 365 * 100

/**
 * Utility - Data Transformation Layer: Normalizes raw protocol data into the app schema.
 * Performs three (3) critical operations:
 * 1. Type Casting: Converts API strings/BigInts into JS floats for math operations.
 * 2. Metric Derivation: Calculates pool age and estimated APY based on historical fee accrual.
 * 3. UI Formatting: Generates human-readable strings (K, M, B) for financial dashboards.
 * @param {Array<Object>} rawPools - Collection of pool objects from the API
 * @param {string} rawPools[].id - Deployment address of the pool
 * @param {string} rawPools[].totalValueLockedUSD - TVL in strig format
 * @param {string} rawPools[].createdAtTimestamp - Unix timestamp of pool creation
 * @param {Object} rawPools[].token0 - Metadata for the first token in the pair
 * @returns {Array<Object>} Normalized pool objects with "formatted" sufixes and calculated apyBase
 */
export function formatPoolData(rawPools) {
  /**
   * Formats large denominations into human-readable strings (K, M, B).
   * Precision: 1 decimal place for abbreviated values, 2 for raw numbers.
   */
  function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toFixed(2)
  }

  /**
   * Converts Unix timestamps to pool age.
   * Unit: Days (floating point).
   */
  function calculatePoolAge(createdAtTimestamp) {
    const poolAgeDays = (Date.now() / 1000 - createdAtTimestamp) / 86400
    return poolAgeDays
  }

  /**
   * Estimates APY using an "Accumulated Fees" approach.
   * CRITICAL AUDIT NOTE: This formula assumes "collectedFeesUSD" is the total
   * fees since inception. If the API returns a 24h snapshot,
   * the poolAgeDays division will result in a near-zero APY.
   */
  function calculateAPY(
    collectedFeesUSD,
    volumeUSD,
    feeTier,
    poolAgeDays,
    totalValueLockedUSD,
  ) {
    // Safety Checks: Avoid division by zero and handle nascent pools
    if (poolAgeDays < 1) return 0
    if (totalValueLockedUSD === 0) return 0
    if (!poolAgeDays || !totalValueLockedUSD) return 0

    let feesForCalculation = collectedFeesUSD

    // Heuristic: Fallback for missing/corrupt fee data
    // If fees are suspiciously low (<$100), estimate based on volume * feeTier
    // 1,000,000 divisor converts Basis Points to decimal
    if (collectedFeesUSD < 100) {
      const feeRate = feeTier / 1000000
      feesForCalculation = volumeUSD * feeRate
    }

    if (!feesForCalculation) return 0

    // APY Projection: Extrapolates historical daily average to annual percentage
    const dailyFeeRate = feesForCalculation / poolAgeDays / totalValueLockedUSD
    const apyBase = dailyFeeRate * 365 * 100

    return apyBase
  }

  return rawPools.map((pool) => {
    // Type Casting: Force all numeric inputs to float to prevent concatenation errors
    const feeTier = parseFloat(pool.feeTier)
    const liquidity = parseFloat(pool.liquidity)
    const tvlUsd = parseFloat(pool.totalValueLockedUSD)
    const volumeUsd1d = parseFloat(pool.volumeUSD)
    const token0Price = parseFloat(pool.token0Price)
    const token0tvl = parseFloat(pool.totalValueLockedToken0)
    const token0Vol = parseFloat(pool.volumeToken0)
    const token0feesUSD = parseFloat(pool.collectedFeesToken0)
    const token1tvl = parseFloat(pool.totalValueLockedToken1)
    const token1Vol = parseFloat(pool.volumeToken1)
    const token1feesUSD = parseFloat(pool.collectedFeesToken1)
    const feesUSD = parseFloat(pool.collectedFeesUSD)
    const poolAgeDays = calculatePoolAge(pool.createdAtTimestamp)

    const apyBase = calculateAPY(
      feesUSD,
      volumeUsd1d,
      feeTier,
      poolAgeDays,
      tvlUsd,
    )

    return {
      // UI-ready schema: Consolidates symbols and formats financial values
      id: pool.id,
      symbol: `${pool.token0.symbol} / ${pool.token1.symbol || 'UNKNOWN'}`,
      feeTier,
      feeTierFormatted: `${feeTier / 10000}%`,
      name: `${pool.token0.symbol} / ${pool.token1.symbol || 'LP Pool'}`,
      chain: 'ethereum',
      project: 'uniswap-v3',
      platformName: 'Uniswap V3',
      apyBase,
      apyFormatted: `${apyBase.toFixed(2)}%`,
      liquidity: liquidity || 0,
      liquidityFormatted: formatNumber(liquidity),
      tvlUsd: tvlUsd || 0,
      tvlFormatted: formatNumber(tvlUsd),
      volumeUsd1d: volumeUsd1d || 0,
      volumeFormatted: formatNumber(volumeUsd1d),
      feesUSD: feesUSD || 0,
      feesUSDFormatted: formatNumber(feesUSD),
      poolAgeDays,
      token0Price: token0Price || 0,
      token0id: pool.token0.id,
      token0symbol: pool.token0.symbol,
      token0name: pool.token0.name,
      token0PriceFormatted: formatNumber(token0Price),
      token0tvl: token0tvl || 0,
      token0tvlFormatted: formatNumber(token0tvl),
      token0Vol: token0Vol || 0,
      token0VolFormatted: formatNumber(token0Vol),
      token0feesUSD: token0feesUSD || 0,
      token0feesUSDFormatted: formatNumber(token0feesUSD),
      token1id: pool.token1.id,
      token1symbol: pool.token1.symbol,
      token1name: pool.token1.name,
      token1tvl: token1tvl || 0,
      token1tvlFormatted: formatNumber(token1tvl),
      token1Vol: token1Vol || 0,
      token1VolFormatted: formatNumber(token1Vol),
      token1feesUSD: token1feesUSD || 0,
      token1feesUSDFormatted: formatNumber(token1feesUSD),
    }
  })
}
