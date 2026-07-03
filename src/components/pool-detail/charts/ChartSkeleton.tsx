import { ReactNode } from "react"

export function ChartSkeleton(): ReactNode {
  return (
    <div className="rounded-2xl glass-surface p-4 animate-pulse">
      <div className="h-6 w-48 bg-base-300 rounded-xl mb-4"/>
      <div className="h-[300px] bg-base-300/50 rounded-xl"/>
    </div>
  )
}
