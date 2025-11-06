import { defer } from "react-router-dom"

export async function poolsLoader() {
   const mockPools = Array.from({ length: 20 }, (_, i) => ({
      id: `pool-${i + 1}`,
      name: `Pool ${i + 1} USDC/ETH`,
      chain: i % 3 === 0 ? "Ethereum" : i % 3 === 1 ? "Polygon" : "Arbitrum",
      apy: (Math.random() * 15 + 2).toFixed(2),
      tvl: `$${(Math.random() * 500 + 50).toFixed(2)}M`,
      risk: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      verified: Math.random() > 0.3,
   }))

   return defer({ pools: mockPools })
}