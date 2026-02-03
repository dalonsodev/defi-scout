import { describe, it, expect } from "vitest"
import {
   priceToTick,
   tickToPrice,
   getTickSpacing,
   alignTickToSpacing,
   incrementPriceByTick
} from "./uniswapV3Ticks.js"

const MIN_TICK = -887272
const MAX_TICK = 887272

describe("uniswapV3Ticks", () => {
   describe("priceToTick", () => {
      it("should convert ETH/USDC price ~$3000 to tick ~80067", () => {
         const tick = priceToTick(3000)
         expect(tick).toBeCloseTo(80067, -1)
      })

      it("should return MIN_TICK for zero price", () => {
         expect(priceToTick(0)).toBe(MIN_TICK)
      })

      it("should return MIN_TICK for negative prices", () => {
         expect(priceToTick(-100)).toBe(MIN_TICK)
      })

      it("should clamp extremely high prices to MAX_TICK", () => {
         expect(priceToTick(Infinity)).toBe(MAX_TICK)
         expect(priceToTick(1e100)).toBe(MAX_TICK)
      })

      it("should handle stablecoin prices near 1.0", () => {
         const tick = priceToTick(1.0)
         expect(tick).toBe(0) // Price = 1 → tick = 0
      })

      it("should handle prices < 1 (inverted pairs)", () => {
         const tick = priceToTick(0.0003) // USDC/ETH at $3000 ETH
         expect(tick).toBeLessThan(0)
      })
   })

   describe("tickToPrice", () => {
      it("should convert tick 0 to price 1.0", () => {
         expect(tickToPrice(0)).toBeCloseTo(1.0, 5)
      })

      it("should convert tick 80067 to price ~3000", () => {
         const price = tickToPrice(80067)
         expect(price).toBeCloseTo(3000, 0)
      })

      it("should clamp tick below MIN_TICK", () => {
         const price = tickToPrice(-999999)
         expect(price).toBeGreaterThan(0)
         expect(price).toBeLessThan(1e-30) // Very small but not zero
      })

      it("should clamp tick above MAX_TICK", () => {
         const price = tickToPrice(999999)
         expect(price).toBeGreaterThan(1e30) // Very large
      })

      it("should round fractional ticks", () => {
         expect(tickToPrice(100.7)).toBe(tickToPrice(101))
      })
   })

   describe("getTickSpacing", () => {
      it("should return 1 for 0.01% fee tier", () => {
         expect(getTickSpacing(100)).toBe(1)
      })

      it("should return 4 for 0.02% fee tier", () => {
         expect(getTickSpacing(200)).toBe(4)
      })

      it("should return 10 for 0.05% fee tier", () => {
         expect(getTickSpacing(500)).toBe(10)
      })

      it("should return 60 for 0.3% fee tier", () => {
         expect(getTickSpacing(3000)).toBe(60)
      })

      it("should return 200 for 1.0% fee tier", () => {
         expect(getTickSpacing(10000)).toBe(200)
      })

      it("should default to 60 for unknown fee tier", () => {
         expect(getTickSpacing(9999)).toBe(60)
         expect(getTickSpacing(12345)).toBe(60)
      })
   })

   describe("alignTickToSpacing", () => {
      it("should align tick 100 to spacing 60 → 120", () => {
         expect(alignTickToSpacing(100, 60)).toBe(120)
      })

      it("should align tick 59 to spacing 60 → 60", () => {
         expect(alignTickToSpacing(59, 60)).toBe(60)
      })

      it("should align tick -100 to spacing 60 → -120", () => {
         expect(alignTickToSpacing(-100, 60)).toBe(-120)
      })

      it("should keep already-aligned ticks unchanged", () => {
         expect(alignTickToSpacing(120, 60)).toBe(120)
         expect(alignTickToSpacing(0, 10)).toBe(0)
      })

      it("should handle spacing 1 (no change)", () => {
         expect(alignTickToSpacing(12345, 1)).toBe(12345)
      })
   })

   describe("incrementPriceByTick", () => {
      it("should increment price by one tick spacing (0.3% fee)", () => {
         const newPrice = incrementPriceByTick(3000, 3000, 1)
         const expectedTick = alignTickToSpacing(priceToTick(3000), 60) + 60
         expect(newPrice).toBeCloseTo(tickToPrice(expectedTick), 2)
      })

      it("should decrement price by one tick spacing", () => {
         const newPrice = incrementPriceByTick(3000, 3000, -1)
         const expectedTick = alignTickToSpacing(priceToTick(3000), 60) - 60
         expect(newPrice).toBeCloseTo(tickToPrice(expectedTick), 2)
      })

      it("should handle 0.05% fee tier (spacing 10)", () => {
         const newPrice = incrementPriceByTick(1.5, 500, 1)
         const expectedTick = alignTickToSpacing(priceToTick(1.5), 10) + 10
         expect(newPrice).toBeCloseTo(tickToPrice(expectedTick), 5)
      })

      it("should clamp to MIN_TICK when decrementing from very low price", () => {
         const newPrice = incrementPriceByTick(0.0001, 3000, -1)
         expect(newPrice).toBeGreaterThan(0)
         // Should be near MIN_TICK price
      })

      it("should clamp to MAX_TICK when incrementing from very high price", () => {
         const newPrice = incrementPriceByTick(1e50, 3000, 1)
         expect(newPrice).toBeLessThan(Infinity)
      })

      it("should default direction to 1 if not specified", () => {
         const up1 = incrementPriceByTick(1000, 3000, 1)
         const upDefault = incrementPriceByTick(1000, 3000)
         expect(up1).toBe(upDefault)
      })

      it("should handle stablecoin pairs with spacing 1", () => {
         const newPrice = incrementPriceByTick(1.0001, 100, 1)
         expect(newPrice).toBeGreaterThan(1.0001)
      })
   })
})
