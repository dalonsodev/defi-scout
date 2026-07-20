import { GraphQLClient, gql } from 'graphql-request'
import {
  PoolTickResult,
  RawPool,
  RawPoolDayData,
  RawPoolHourData,
  RawBundle,
  RawPoolHistory,
  RawPoolTicks
} from '../types'

interface PoolVariables {
  first: number
  skip: number
  orderBy: string
  orderDirection: 'asc' | 'desc'
  minTVL: string
  minVol: string
}

interface PoolHistoryResult {
  pool: RawPoolHistory
  history: RawPoolDayData[]
  ethPriceUSD: number
}

interface PoolHistoryResponse {
  pool: RawPoolHistory
  bundle: RawBundle
  poolDayDatas: RawPoolDayData[]
}

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
      tick
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

/**
 * Analytical Query: Pool ticks for display in Liquidity Distribution chart
 *
 * Note: TheGraph uses BigInt! type for $currentTick. However, we pass
 * the value as integer and let the client handle serialization.
 *
 * Architectural Decision: Instead of using a window for displaying ticks in
 * LiquidityChart, we split the query in ticks 'below' and ticks 'above' current
 * tick. This way, we avoid returning a small quantity of bars in scenarios with
 * sparse pool liquidity.
 */
const GET_POOL_TICKS_QUERY = gql`
  query GetPoolTicks($poolId: ID!, $currentTick: BigInt!) {
    pool(id: $poolId) {
      tick # Current active tick (integer)
      liquidity
      ticksBelow: ticks(
        first: 500
        where: { tickIdx_lt: $currentTick }
        orderBy: tickIdx
        orderDirection: desc
      ) {
        tickIdx
        liquidityNet # Delta when price crosses this tick upward
        liquidityGross # Total liquidity referencing this tick
      }
      ticksAbove: ticks(
        first: 500
        where: { tickIdx_gte: $currentTick }
        orderBy: tickIdx
        orderDirection: asc
      ) {
        tickIdx
        liquidityNet
        liquidityGross
      }
    }
  }
`

/**
 * Batch Sparkline Query: Fetches 14-day trend data for multiple pools.
 *
 * Schema Note: poolDayDatas is a root-level entity (not nested under Pool).
 * We query all daily snapshots matching the pool list, then group client-side.
 *
 * Performance: 40 pools × 14 days = 560 poolDayData entities (under 1000 limit).
 */
const GET_POOL_SPARKLINES_QUERY = gql`
  query GetPoolSparklines($poolIds: [String!]!, $startDate: Int!) {
    poolDayDatas(
      where: { pool_in: $poolIds, date_gte: $startDate }
      orderBy: date
      orderDirection: asc
      first: 1000
    ) {
      pool {
        id
      }
      date
      feesUSD
      tvlUSD
    }
  }
`

/**
 * Query: Fetches a specific set of pools by ID from TheGraph.
 * Used by the watchlist loader to retrieve fresh data for user-saved pools.
 *
 * Variable: $ids [ID!] - Array of pool contract addresses
 * Ordered by TVL descending (highest liquidity pools surface first)
 */
const GET_WATCHED_POOLS_QUERY = gql`
  query GetWatchedPools($ids: [ID!]) {
    pools(where: { id_in: $ids }, orderBy: totalValueLockedUSD, orderDirection: desc) {
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
 * Service: Batch-fetches live pool data for a user's watchlist.
 * Returns the same shape as fetchPools() - compatible with PoolTable rendering.
 *
 * @param poolIds - Pool contract addresses from Firestore favorites
 * @returns Fresh pool objects ordered by TVL desc
 *
 * @example
 * const pools = await fetchWatchedPools([
 *  "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
 *  "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
 * ])
 * // => [{ id, feeTier, totalValueLockedUSD, token0, token1, ... }]
 */
export async function fetchWatchedPools(poolIds: string[]): Promise<RawPool[]> {
  const data = await client.request<{ pools: RawPool[] }>(GET_WATCHED_POOLS_QUERY, { ids: poolIds })
  return data.pools
}

/**
 * Service: Batch-fetches 14-day historical data for sparkline rendering.
 *
 * @param poolAddresses - Array of pool contract addresses
 * @returns Dictionary: { poolId: [poolDayDatas, ...] }
 *
 * @example
 * const data = await fetchPoolSparklines([
 *  "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
 *  "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
 * ])
 * // => {
 * //   "0x8ad...": [{ date: 123, feesUSD: "456", tvlUSD: "789" }, ...],
 * //   "0x88e...": [...]
 * // }
 */
export async function fetchPoolSparklines(
  poolAddresses: string[]
): Promise<Record<string, RawPoolDayData[]>> {
  // Calculate 14 days ago (Unix timestamp in seconds)
  const startDate = Math.floor(Date.now() / 1000) - 14 * 86400

  const data = await client.request<{ poolDayDatas: RawPoolDayData[] }>(GET_POOL_SPARKLINES_QUERY, {
    poolIds: poolAddresses.filter(Boolean).map((addr) => addr.toLowerCase()),
    startDate
  })

  // Group flat array by pool ID (TheGraph returns all poolDayDatas in one array)
  const grouped: Record<string, RawPoolDayData[]> = {}

  data.poolDayDatas.forEach((dayData: RawPoolDayData): void => {
    if (!dayData.pool?.id) throw new Error('Missing pool reference on poolDayData')

    const poolId = dayData.pool.id

    if (!grouped[poolId]) {
      grouped[poolId] = []
    }

    grouped[poolId].push(dayData)
  })

  return grouped
}

/**
 * Utility: Converts raw poolDayDatas into APY percentage array for sparkline rendering.
 *
 * Calculation: APY = (Daily Fees / TVL) * 365 * 100
 * This matches the formula used in formatPoolHistory.js for consistency.
 *
 * @param poolDayDatas - Array of daily snapshots from TheGraph
 * @returns Array of APY percentages (up to 14 values)
 *
 * @example
 * const apyArray = formatSparklineData([
 *  { date: 19800, feesUSD: "1000", tlvUSD: "50000" },
 *  { date: 19801, feesUSD: "1200", tlvUSD: "52000" },
 * ])
 * // => [7.30, 8.42] (APY percentages)
 */
export function formatSparklineData(poolDayDatas: RawPoolDayData[]): number[] {
  if (!poolDayDatas || poolDayDatas.length === 0) return []

  return poolDayDatas.map((snapshot) => {
    const feesUSD = parseFloat(snapshot.feesUSD)
    const tvlUSD = parseFloat(snapshot.tvlUSD)

    // Safety check: Avoid division by zero
    if (!tvlUSD || tvlUSD === 0) return 0

    // APY calculation: (daily fees / TVL) * 365 days * 100 for percentage
    const dailyRate = feesUSD / tvlUSD
    const apy = dailyRate * 365 * 100

    return apy
  })
}

// ===== SERVICE LAYER =====

/**
 * Service: Fetches pools from Uniswap v3 subgraph with quality filters.
 *
 * Design Decision: Configured for top 1000 pools by liquidity (not all 8k+)
 * to ensure consistent UX. Low-TVL pools have unreliable APY data and high
 * slippage risk, making them unsuitable for a portfolio showcase.
 *
 * @param variables - GraphQL query variables
 * @param variables.first - Number of pools to fetch
 * @param variables.skip - Pagination offset
 * @param variables.orderBy - Field to sort by (e.g. "totalValueLockedUSD")
 * @param variables.orderDirection - "asc" or "desc"
 * @param variables.minTVL - Minimum TVL in USD (string for precision)
 * @param variables.minVol - Minimum 24h volume in USD
 *
 * @returns Array of pool objects (tokens, TVL, volume, fees)
 */
export async function fetchPools(variables: PoolVariables): Promise<RawPool[]> {
  const data = await client.request<{ pools: RawPool[] }>(GET_POOLS_QUERY, variables)
  return data.pools
}

/**
 * Service: Fetches 30-day historical data for pool detail charts.
 *
 * @param poolId - Pool contract address (case-insensitive, normalized to lowercase)
 * @param startDate - Unix timestamp in seconds for oldest data point
 *
 * @returns Pool metadata plus daily historical snapshots and current ETH price
 */
export async function fetchPoolHistory(
  poolId: string,
  startDate: number
): Promise<PoolHistoryResult> {
  const normalizedId = poolId.toLowerCase()
  const data = await client.request<PoolHistoryResponse>(GET_POOL_HISTORY_QUERY, {
    // TheGraph indexes addresses in lowercase (checksummed addresses return null)
    poolId: normalizedId,
    poolIdString: normalizedId,
    startDate
  })
  return {
    pool: data.pool,
    history: data.poolDayDatas,
    ethPriceUSD: parseFloat(data.bundle?.ethPriceUSD) || 0
  }
}

/**
 * Service: Fetches hourly snapshots for concentrated liquidity range simulations.
 *
 * @param poolId - Pool contract address (case-insensitive)
 * @param startTime - Unix timestamp in seconds (epoch start of hour)
 *
 * @returns Array of hourly datapoints (up to 720 items = 30 days)
 */
export async function fetchPoolHourData(
  poolId: string,
  startTime: number
): Promise<RawPoolHourData[]> {
  const data = await client.request<{ poolHourDatas: RawPoolHourData[] }>(
    GET_POOL_HOUR_DATAS_QUERY,
    {
      poolId: poolId.toLowerCase(),
      startTime
    }
  )
  return data.poolHourDatas
}

/**
 * Service: Fetches pool ticks for Liquidity Distribution chart in PoolCharts
 *
 * @param poolId - Pool contract address (case-insensitive)
 * @param currentTick - Current active tick
 *
 * @returns Current active tick with liquidity and an ordered tick array (up to 1000 items)
 */
export async function fetchPoolTicks(poolId: string, currentTick: number): Promise<PoolTickResult> {
  const data = await client.request<{ pool: RawPoolTicks }>(GET_POOL_TICKS_QUERY, {
    poolId: poolId.toLowerCase(),
    currentTick
  })
  const tick = data.pool.tick
  const liquidity = data.pool.liquidity
  const ticks = [...data.pool.ticksBelow.reverse(), ...data.pool.ticksAbove]

  return { tick, liquidity, ticks }
}
