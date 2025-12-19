export function assessDataQuality(hourlyData) {
   const hours = hourlyData.length

   if (hours < 168) return { quality: "INSUFFICIENT", warnings: [] }
   if (hours < 336) return { quality: "LIMITED", warnings: "Less than 14 days of data."}
   if (hours < 720) return { quality: "RELIABLE", warnings: [] }
   return { quality: "EXCELLENT", warnings: [] }
}