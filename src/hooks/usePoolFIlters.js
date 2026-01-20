import { useCallback, useState } from "react"

export function usePoolFilters() {
   const [filters, setFilters] = useState({
      search: "",
      platforms: [],
      tvlUsd: "",
      volumeUsd1d: "",
      riskLevel: ""
   })

   const updateFilter = useCallback((key, value) => {
      setFilters(prev => ({
         ...prev,
         [key]: value
      }))
   }, [])

   const togglePlatform = useCallback((platform) => {
      setFilters(prev => ({
         ...prev,
         platforms: prev.platforms.includes(platform)
            ? prev.platforms.filter(p => p !== platform)
            : [...prev.platforms, platform]
      }))
   }, [])

   const clearFilters = useCallback(() => {
      setFilters({
         search: "",
         platforms: [],
         tvlUsd: "",
         volumeUsd1d: "",
         riskLevel: ""
      })
   }, [])

   return {
      filters,
      updateFilter,
      togglePlatform,
      clearFilters
   }
}