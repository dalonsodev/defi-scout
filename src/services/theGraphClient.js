import { GraphQLClient, gql } from 'graphql-request'

// ===== CONFIGURATION =====

const SUBGRAPH_URL =
  'https://gateway.thegraph.com/api/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV'
const API_KEY = import.meta.env.VITE_THEGRAPH_API_KEY

const client = new GraphQLClient(SUBGRAPH_URL, {
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
})

// ===== QUERY DEFINITIONS =====

/**
 * Discovery Query: Retrieves top-tier pools based on liquidity and activity.
 * Note: GraphQL requires TVL/Volume as strings for high-precision comparisons.
 */
const GET_POOLS_QUERY = gql`
  query GetPools(
    $first: Int!
    $skip: Int!
    $orderDirection: String!
    $orderBy: String!
    $minTVL: String!
    $minVol: String!
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { totalValueLockedUSD_gt: $minTVL, volumeUSD_gt: $minVol }
    ) {
      id
      feeTier
      liquidity
      totalValueLockedUSD
      totalValueLockedToken0
      totalValueLockedToken1
      volumeUSD
      volumeToken0
      volumeToken1
      collectedFeesUSD
      collectedFeesToken0
      collectedFeesToken1
      token0Price
      token1Price
      createdAtTimestamp
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`

/**
 * Analytical Query: Fetches a combined set of metadata, price oracles, and daily trends.
 */
const GET_POOL_HISTORY_QUERY = gql`
  query GetPoolHistory($poolId: ID!, $poolIdString: String!, $startDate: Int!) {
    # Pool metadata (current state)
    pool(id: $poolId) {
      id
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
      token0Price
      token1Price
      token0 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      token1 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      createdAtTimestamp
    }

    # Uniswap Oracle: The "bundle" with id "1" is the global singleton
    # that stores the current ETH price in USD for derived valuations
    bundle(id: "1") {
      ethPriceUSD
    }

    # Historical snapshots (daily)
    poolDayDatas(
      where: { pool: $poolIdString, date_gte: $startDate }
      first: 1000
      orderBy: date
      orderDirection: asc
    ) {
      date
      volumeUSD
      tvlUSD
      feesUSD
      token0Price
      token1Price
    }
  }
`

/**
 * High-Resolution Analytical Query
 *
 * Use Case: Powers concentrated liquidity range calculator by analyzing short-term
 * price volatility and liquidity depth. Hourly granularity (vs daily) required to
 * detect intraday rebalancing patterns and flash crash risk.
 *
 * Trade-off: 720-item limit (30 days × 24 hours) balances historical depth vs
 * query performance. TheGraph enforces 1000-item max, so 720 leaves headroom for
 * pagination edge cases.
 */
const GET_POOL_HOUR_DATAS_QUERY = gql`
  query GetPoolHourDatas($poolId: String!, $startTime: Int!) {
    poolHourDatas(
      where: { pool: $poolId, periodStartUnix_gte: $startTime }
      orderBy: periodStartUnix
      orderDirection: asc
      first: 720
    ) {
      periodStartUnix
      token0Price
      token1Price
      feesUSD
      sqrtPrice
      liquidity
      tvlUSD
      tick
    }
  }
`

// ===== SERVICE LAYER =====

/**
 * Service: Fetches pools from Uniswap v3 subgraph with quality filters.
 *
 * Design Decision: Configured for top 1000 pools by liquidity (not all 8k+)
 * to ensure consistent UX. Low-TVL pools have unreliable APY data and high
 * slippage risk, making them unsuitable for a portfolio showcase.
 *
 * @param {Object} variables - GraphQL query variables
 * @param {number} variables.first - Number of pools to fetch
 * @param {number} variables.skip - Pagination offset
 * @param {string} variables.orderBy - Field to sort by (e.g. "totalValueLockedUSD")
 * @param {string} variables.orderDirection - "asc" or "desc"
 * @param {string} variables.minTVL - Minimum TVL in USD (string for precision)
 * @param {string} variables.minVol - Minimum 24h volume in USD
 *
 * @returns {Promise<Array>} Array of pool objects (tokens, TVL, volume, fees)
 */
export async function fetchPools(variables) {
  const data = await client.request(GET_POOLS_QUERY, variables)
  return data.pools
}

/**
 * Service: Fetches 30-day historical data for pool detail charts.
 *
 * @param {string} poolId - Pool contract address (case-insensitive, normalized to lowercase)
 * @param {number} startDate - Unix timestamp in seconds for oldest data point
 *
 * @returns {Promise<Object>} result
 * @returns {Object} result.pool - Pool metadata (tokens, TVL, prices)
 * @returns {Array} result.history - Daily snapshots (volumeUSD, tvlUSD, feesUSD, prices)
 */
export async function fetchPoolHistory(poolId, startDate) {
  const normalizedId = poolId.toLowerCase()
  const data = await client.request(GET_POOL_HISTORY_QUERY, {
    // TheGraph indexes addresses in lowercase (checksummed addresses return null)
    poolId: normalizedId,
    poolIdString: normalizedId,
    startDate
  })
  return {
    pool: data.pool,
    history: data.poolDayDatas,
    ethPriceUSD: parseFloat(data.bundle?.ethPriceUSD || 0)
  }
}

/**
 * Service: Fetches hourly snapshots for concentrated liquidity range simulations.
 *
 * @param {string} poolId - Pool contract address (case-insensitive)
 * @param {number} startTime - Unix timestamp in seconds (epoch start of hour)
 *
 * @returns {Promise<Array>} Array of hourly datapoints (up to 720 items = 30 days)
 */
export async function fetchPoolHourData(poolId, startTime) {
  const data = await client.request(GET_POOL_HOUR_DATAS_QUERY, {
    poolId: poolId.toLowerCase(),
    startTime
  })
  return data.poolHourDatas
}
