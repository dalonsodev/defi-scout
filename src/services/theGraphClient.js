import { GraphQLClient, gql } from "graphql-request"

// 1. Configuration
const SUBGRAPH_URL = "https://gateway.thegraph.com/api/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
const API_KEY = import.meta.env.VITE_THEGRAPH_API_KEY

const client = new GraphQLClient(SUBGRAPH_URL, {
   headers: {
      Authorization: `Bearer ${API_KEY}`
   }
})

// 2. Query definitions
const GET_POOLS_QUERY = gql`
   query GetPools(
      $first: Int!, 
      $skip: Int!,
      $orderDirection: String!,
      $orderBy: String!,
      $minTVL: String!,
      $minVol: String!
   ) {
      pools(
         first: $first
         skip: $skip
         orderBy: $orderBy
         orderDirection: $orderDirection
         where: {
            totalValueLockedUSD_gt: $minTVL
            volumeUSD_gt: $minVol
         }
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

const GET_POOL_HISTORY_QUERY = gql`
   query GetPoolHistory($poolId: String!, $startDate: Int!) {
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
         }
         token1 {
            id
            symbol
            name
         }
         createdAtTimestamp
      }

      # Historical snapshots (daily)
      poolDayDatas(
         where: {
            pool: $poolId
            date_gte: $startDate
         }
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

const GET_POOL_HOUR_DATAS_QUERY = gql`
   query GetPoolHourDatas($poolId: String!, $startTime: Int!) {
      poolHourDatas(
         where: {
            pool: $poolId
            periodStartUnix_gte: $startTime
         }
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

// 3. Exported functions
/**
 * Fetches pools from Uniswap v3 subgraph
 * @param {Object} variables - GraphQL variables
 * @param {number} variables.first - Number of pools to fetch
 * @param {number} variables.skip - Pagination offset
 * @param {string} variables.orderBy - Field to order by
 * @param {string} variables.orderDirection - "asc" or "desc"
 * @param {string} variables.minTVL - Minimum TVL in USD (string format)
 * @param {string} variables.minVol - Minimum Volume in USD
 * @returns {Promise<Array>} Array of pool objects
 */

export async function fetchPools(variables) {
   const data = await client.request(GET_POOLS_QUERY, variables)
   return data.pools
}

/**
 * Fetches historical data for a specific pool
 * @param {string} poolId - Pool contract address (lowercase)
 * @param {number} startDate - Unix timestamp (seconds) for oldest data point
 * @returns {Promise<Array>} Array of daily snapshots
 */

export async function fetchPoolHistory(poolId, startDate) {
   const data = await client.request(GET_POOL_HISTORY_QUERY, {
      poolId: poolId.toLowerCase(), // The Graph normalizes addresses to lowercase
      startDate
   })
   return {
      pool: data.pool,
      history: data.poolDayDatas
   }
}

/**
 * Fetches hourly historical data for a specific pool
 * @param {string} poolId - Pool contract address (lowercase)
 * @param {number} startTime - Unix timestamp (seconds) for oldest data point
 * @returns {Promise<Array>} Array of hourly snapshots (up to 720 items)
 */

export async function fetchPoolHourData(poolId, startTime) {
   const data = await client.request(GET_POOL_HOUR_DATAS_QUERY, {
      poolId: poolId.toLowerCase(),
      startTime
   })
   return data.poolHourDatas
}