import { ReactNode } from 'react'

export function ChartSkeleton(): ReactNode {
  return (
    <div className="glass-surface animate-pulse rounded-2xl p-4">
      <div className="bg-base-300 mb-4 h-6 w-48 rounded-xl" />
      <div className="bg-base-300/50 h-[300px] rounded-xl" />
    </div>
  )
}
