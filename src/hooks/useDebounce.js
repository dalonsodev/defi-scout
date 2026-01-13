import { useState, useEffect, useRef } from "react"

export function useDebounce(value, delay) {
   const [debouncedValue, setDebouncedValue] = useState(value)
   const valueRef = useRef(value)

   useEffect(() => {
      if (valueRef.current !== value) {
         valueRef.current = value
         const handler = setTimeout(() => {
            setDebouncedValue(value)
         }, delay)
         
         return () => clearTimeout(handler)
      }
   }, [value, delay])

   return debouncedValue
}