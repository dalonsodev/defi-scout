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