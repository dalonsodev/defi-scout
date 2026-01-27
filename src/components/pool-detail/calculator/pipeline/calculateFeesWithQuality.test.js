import { describe, it, expect } from "vitest"
import { calculateFeesWithQuality } from "./calcululateFeesWithQuality"

describe("calculateFeesWithQuality", () => {
   it("returns success with accumulated fees", () => {
      const result = calculateFeesWithQuality({
         hourlyData: [
            { token0Price: "3000", liquidity: "1000000000000000000000000", feesUSD: "100"},
            { token0Price: "3100", liquidity: "1000000000000000000000000", feesUSD: "150"}
         ],
         effectiveMin: 2500,
         effectiveMax: 3500,
         L_user: 1e12,
         liquidityExponent: 12,
         initialQuality: "EXCELLENT"
      })

      expect(result.success).toBe(true)
      expect(result.totalFeesUSD).toBeGreaterThan(0)
      expect(result.hoursInRange).toBe(2)
   })

   it("downgrades quality when anomaly rate > 20%", () => {
      const result = calculateFeesWithQuality({
         hourlyData: [
            { token0Price: '3000', liquidity: '1000000000000000000000000', feesUSD: '100' },
            { token0Price: 'NaN', liquidity: '1000000000000000000000000', feesUSD: '100' }, // Corrupt
            { token0Price: 'NaN', liquidity: '1000000000000000000000000', feesUSD: '100' }, // Corrupt
            { token0Price: '3100', liquidity: '1000000000000000000000000', feesUSD: '100' }
         ],
         effectiveMin: 2500,
         effectiveMax: 3500,
         L_user: 1e12,
         liquidityExponent: 12,
         initialQuality: 'EXCELLENT'
      })

      expect(result.finalQuality).toBe("RELIABLE") // Downgraded (2/4 = 50% anomaly)
   })
})
