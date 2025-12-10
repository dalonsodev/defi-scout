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
