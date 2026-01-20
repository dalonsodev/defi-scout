import { useEffect, useState } from "react"

export function useBreakpoint() {
   const [isDesktop, setIsDesktop] = useState(
      window.matchMedia("(min-width: 768px)").matches
   )
   
   useEffect(() => {
      const mq = window.matchMedia("(min-width: 768px)")
      const handleChange = (e) => {
         setIsDesktop(e.matches)
      }  
      mq.addEventListener("change", handleChange)

      return () => mq.removeEventListener("change", handleChange)
   }, [])

   return { isDesktop }
}