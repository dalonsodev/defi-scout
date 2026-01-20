import { useState } from "react"
import { PLATFORM_ICONS } from "../../data/platformIcons"

export function PlatformIcon({ platform, size = "md" }) {
   const [hasError, setHasError] = useState(false)

   const ext = PLATFORM_ICONS[platform]
   const iconUrl = ext ? `https://icons.llama.fi/${platform}.${ext}` : null

   const sizeClasses = {
      sm: 'w-5 h-5',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8'
   }

   const getInitials = (name) => {
      return name.split("-")
         .map(word => word[0])
         .join("")
         .toUpperCase()
         .slice(0, 2)
   }

   if (!iconUrl || hasError ) {
      return (
         <div className={`${sizeClasses[size]} rounded-full bg-base-300 flex items-center justify-center text-xs font-semibold`}>
            {getInitials(platform)}
         </div>
      )
   }

   return (
      <img
         src={iconUrl}
         alt={platform}
         className={`${sizeClasses[size]} rounded-full object-cover`}
         onError={() => setHasError(true)}
      />
   )
}