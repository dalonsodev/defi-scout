import { testPlatformIcon } from "./lib/testPlatformIcon.js"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const PLATFORMS = [
   "curve-dex",
   "uniswap-v2",
   "fluid-dex",
   "uniswap-v3",
   "raydium-amm",
   "kamino-liquidity",
   "sushiswap",
   "osmosis-dex",
   "orca-dex",
   "joe-v2.1",
   "aerodrome-slipstream",
   "pancakeswap-amm-v3",
   "aerodrome-v1",
   "etherex-cl",
   "cetus-clmm",
   "camelot-v3",
   "camelot-v2",
   "pendle",
   "alien-base-v3",
   "maverick-v2",
   "meridian-amm",
   "shadow-exchange-clmm",
   "flowx-v3",
   "sushiswap-v3",
   "turbos",
   "smardex-amm",
   "pancakeswap-amm",
   "pangolin-v2",
   "yuzu-finance",
   "interest-curve",
   "hercules-v3",
   "flowx-v2",
   "zealousswap",
   "mosaic-amm",
   "zyberswap-amm",
   "swop",
   "ramses-cl",
   "persistence-dex",
   "sparkdex-v2",
   "koalaswap",
   "joe-v2",
   "kaspacom-dex",
   "nerveswap"
]

export async function buildIconMap() {
   const results = await Promise.allSettled(
      PLATFORMS.map(platform => testPlatformIcon(platform))
   )

   const iconMap = {}

   results.forEach((result, index) => {
      const platform = PLATFORMS[index]

      if (result.status === "fulfilled") {
         iconMap[platform] = result.value
      } else {
         iconMap[platform] = null
      }
   })

   const entries = Object.entries(iconMap)
   const lines = entries.map(([platform, ext]) => {
      const value = ext === null ? "null" : `"${ext}"`
      return `   "${platform}": ${value}`
   })

   const fileContent = `export const PLATFORM_ICONS = {
${lines.join(",\n")}
}
`
   const __filename = fileURLToPath(import.meta.url)
   const __dirname = dirname(__filename)
   const outputPath = join(__dirname, "..", "src", "data", "platformIcons.js")

   writeFileSync(outputPath, fileContent, "utf-8")

   console.log('✅ Icon map generated at:', outputPath)
}

buildIconMap()
