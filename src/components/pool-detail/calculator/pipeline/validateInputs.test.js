import { describe, it, expect } from "vitest"
import { validateInputs } from "./validateInputs"

describe("validateInputs", () => {
   it("reject capital less than $10", () => {
      const result = validateInputs({
         capitalUSD: 5,
         hourlyData: new Array(168).fill({}),
         selectedTokenIdx: 0,
         fullRange: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Capital must be at least $10")
   })

   it("accepts valid inputs in full range", () => {
      const result = validateInputs({
         capitalUSD: 100,
         hourlyData: new Array(168).fill({}),
         selectedTokenIdx: 0,
         fullRange: true
      })

      expect(result.success).toBe(true)
   })
})
