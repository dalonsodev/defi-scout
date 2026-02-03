import { useEffect, useState } from 'react'

/**
 * Custom Hook: Responsive breakpoint tracker.
 *
 * Architecture: Synchronizes React state with CSS media queries using matchMedia API
 * instead of window resize events. Provides boolean flag for logic that can't be
 * handled via Tailwind classes alone (e.g. conditional chart rendering).
 *
 * Performance: matchMedia.addEventListener("change") is ~10x more efficient than
 * throttled resize listeners because it uses browser's native media query engine.
 *
 * Breakpoint: 768px (Tailwind's md) - chosen to match table responsive behavior
 * where <768px hides less critical columns.
 *
 * @returns {{ isDesktop: boolean }} - true when viewport >= 768px
 *
 * @example
 * function ChartContainer() {
 *   const { isDesktop } = useBreakpoint()
 *
 *   // Show dual-axis chart only on desktop (mobile gets simplified version)
 *   return isDesktop ? <ComposedChart /> : <LineChart />
 * }
 */
export function useBreakpoint() {
  const [isDesktop, setIsDesktop] = useState(
    window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handleChange = (e) => {
      setIsDesktop(e.matches)
    }

    // "change" event fires only when breakpoint crosses, not on every pixel resize
    mq.addEventListener('change', handleChange)

    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return { isDesktop }
}
