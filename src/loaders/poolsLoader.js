import { defer } from "react-router-dom"

export async function poolsLoader() {
   const mockPools = Array.from({ length: 20 }, (_, i) => ({
      id: `pool-${i + 1}`,
      name: `Pool ${i + 1} USDC/ETH`,
      chain: i % 3 === 0 ? "Ethereum" : i % 3 === 1 ? "Polygon" : "Arbitrum",
      platform: ["UniswapV2", "UniswapV3", "Orca", "Meteora", "Camelot", "PancakeSwap"][
         Math.floor(Math.random() * 6)
      ],
      apy: (Math.random() * 15 + 2).toFixed(2),
      tvl: `$${(Math.random() * 500 + 50).toFixed(2)}M`,
      vol24h: (Math.random() * 9_900_000 + 100_000).toFixed(2),
      risk: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      verified: Math.random() > 0.3,
   }))

   return defer({ pools: mockPools })
}