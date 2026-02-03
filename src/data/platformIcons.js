/**
 * Platform Icon Registry for Pool Table Rendering
 *
 * Architecture: Manually generated using build script (buildIconMap.js) which:
 * 1. Fetches logos from DeFiLlama CDN
 * 2. Falls back to null if CDN returns 404
 *
 * Data Structure:
 * - Keys: project-id from DeFiLlama API (e.g. "uniswap-v3")
 * - Values: File extension (png/jpg) or null (icon unavailable)
 *
 * @constant {Object<string, string|null>} - PLATFORM_ICONS
 * @property {string|null} [platformId] - File extension or null if unavailable
 *
 * @example
 * // Check if icon exists before rendering
 * const ext = PLATFORM_ICONS["uniswap-v3"]
 * if (ext) {
 *   return <img src={`/icons/uniswap-v3.${ext}`} alt="Uniswap V3" />
 * }
 */
export const PLATFORM_ICONS = {
  'aerodrome-slipstream': 'jpg',
  'aerodrome-v1': 'jpg',
  'alien-base-v3': 'png',
  'camelot-v2': 'png',
  'camelot-v3': 'png',
  'cetus-clmm': 'png',
  'curve-dex': 'jpg',
  'etherex-cl': 'jpg',
  'flowx-v2': 'png',
  'flowx-v3': 'png',
  'fluid-dex': 'png',
  'hercules-v3': 'png',
  'interest-curve': 'jpg',
  'joe-v2': 'jpg',
  'joe-v2.1': null, // Icon unavailable (CDN 404)
  'kamino-liquidity': 'jpg',
  'kaspacom-dex': 'jpg',
  koalaswap: 'jpg',
  'maverick-v2': 'jpg',
  'meridian-amm': 'jpg',
  'mosaic-amm': 'jpg',
  nerveswap: 'png',
  'orca-dex': 'jpg',
  'osmosis-dex': 'jpg',
  'pancakeswap-amm': 'jpg',
  'pancakeswap-amm-v3': 'jpg',
  'pangolin-v2': 'jpg',
  pendle: 'jpg',
  'persistence-dex': 'jpg',
  'ramses-cl': 'jpg',
  'raydium-amm': 'png',
  'shadow-exchange-clmm': 'png',
  'smardex-amm': 'jpg',
  'sparkdex-v2': 'jpg',
  sushiswap: 'png',
  'sushiswap-v3': 'jpg',
  swop: 'png',
  turbos: 'png',
  'uniswap-v2': 'png',
  'uniswap-v3': 'png',
  'yuzu-finance': 'jpg',
  zealousswap: 'jpg',
  'zyberswap-amm': 'jpg',
}
