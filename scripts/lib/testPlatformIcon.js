/**
 * Script Utility: Verifies the availability and format of a platform icon from DefiLlama.
 * Performs a HEAD request to check for .jpg and .png formats with a 10s timeout.
 * @param {string} platform - The platform identifier (e.g. "uniswap-v3")
 * @returns {Promise<"jpg"|"png"|"null">} The available extension or null if not found/timeout
 */
export async function testPlatformIcon(platform) {
   const urlJpg = `https://icons.llama.fi/${platform}.jpg`
   const urlPng = `https://icons.llama.fi/${platform}.png`

   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), 10000)
   const signal = controller.signal

   try {
      const res = await fetch(urlJpg, { method: "HEAD", signal })
      if (res.ok) return "jpg"

      const resPng = await fetch(urlPng, { method: "HEAD", signal })
      if (resPng.ok) return "png"

      return null
   } catch {
      return null
   } finally {
      clearTimeout(timeoutId)
   }
}
