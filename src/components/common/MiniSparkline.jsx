export function MiniSparkline({
   data,
   width = 80,
   height = 40
}) {
   if (!data) return (
      <div className="w-20 h-10 bg-base-300 rounded animate-pulse" />
   )
   
   if (data.length < 2) return (
      <span className="text-xs text-base-content/40 font-medium">No data</span>
   )

   const values = data

   const min = Math.min(...data)
   const max = Math.max(...data)

   const first = values[0]
   const last = values[values.length - 1]

   const strokeColor =
      last > first ? "#10b981" :
      last < first ? "#ef4444" :
      "#6b7280"

   function normalizeY(value) {
      if (max === min) return height / 2
      return height - ((value - min) / (max - min)) * height
   }

   const points = values
      .map((value, index) => {
         const x = (index / (values.length - 1)) * width
         const y = normalizeY(value)
         return `${x},${y}`
      })
      .join(" ")

   return (
      <svg
         width={width}
         height={height}
         viewBox={`0 0 ${width} ${height}`}
         className="inline-block"
         preserveAspectRatio="none"
      >
         <polyline 
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
         />
      </svg>
   )
}