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

/**
 * Build-time script utility: Platform Icon Discovery & Mapping
 * Generate a static mapping of platform identifiers to their available icon formats.
 * It iterates through the PLATFORMS list, probes DefiLlama's CDN for .jpg/.png files,
 * and writes the resulting map to "src/data/platformIcons.js"
 * @async
 * @function buildIconMap
 * @requires testPlatformIcon - Utility to probe CDN endpoints
 * @requires fs - Node.js filesystem for static file generation
 * @returns {Promise<void>} Resolves when the file has been successfully written
 */
export async function buildIconMap() {
   /**
    * Parallel Discovery:
    * Probes all platforms simultaneously using Promise.allSettled to ensure a single
    * failing network does not halt the entire map generation.
    */
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

   /**
    * Code Generation Logic:
    * Manually constructs a JavaScript module string.
    * This avoids a runtime JSON.parse() and allows for direct ESM imports 
    * in the frontend.
    */
   const entries = Object.entries(iconMap)
   const lines = entries.map(([platform, ext]) => {
      const value = ext === null ? "null" : `"${ext}"`
      return `   "${platform}": ${value}`
   })

   const fileContent = `export const PLATFORM_ICONS = {
${lines.join(",\n")}
}
`
   // Path Resolution: Standard Node.js boilerplate for ESM compatibility
   const __filename = fileURLToPath(import.meta.url)
   const __dirname = dirname(__filename)
   const outputPath = join(__dirname, "..", "src", "data", "platformIcons.js")

   // Overwrites the target data file with the new mapping
   writeFileSync(outputPath, fileContent, "utf-8")

   console.log('✅ Icon map generated at:', outputPath)
}

buildIconMap()
