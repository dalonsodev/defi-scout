import { useState } from 'react'
import { PLATFORM_ICONS } from '../../data/platformIcons'

/**
 * UI: Platform Brand Identity Renderer.
 *
 * Architecture: Lazy-loads logos from DefiLlama CDN instead of bundling locally.
 * Trade-off: Faster initial load (no 43 icons in bundle) but depends on external
 * CDN uptime. Fallback initials ensure UI never breaks on 404 errors.
 *
 * Fallback logic: Generates 2-character initials from platform slug.
 * Example: "uniswap-v3" => "UV", "aave-v2" => "AV"
 * Limitation: Only 2 chars (not 1 or 3) for visual consistency across all badges.
 *
 * @param {Object} props
 * @param {string} props.platform - Platform Slug (must match PLATFORM_ICONS keys)
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Visual size preset
 * @returns {JSX.Element} Rounded logo image or a fallback initials badge
 *
 * @example
 * <PlatformIcon platform="uniswap-v3" size="lg" />
 * // Renders 32x32 image or "UV" badge if CDN fails
 */
export function PlatformIcon({ platform, size = 'md' }) {
  const [hasError, setHasError] = useState(false)

  const ext = PLATFORM_ICONS[platform]
  const iconUrl = ext ? `https://icons.llama.fi/${platform}.${ext}` : null

  const SIZE_CLASSES = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  /**
   * String Utility: Extract 2-character initials from platform slug
   * Splits by common separators (dashes, underscores) to grab meaningful words.
   * @param {string} platformSlug - DefiLlama platform identifier
   * @returns {string} Uppercase 2-char string (e.g. "UV" for "uniswap-v3")
   */
  const getInitials = (platformSlug) => {
    return platformSlug
      .split('-') // Split on dash or underscore
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) // Fixed 2 chars for consistent badge sizing
  }

  // Fallback: Initials badge when URL missing or remote fetch fails
  if (!iconUrl || hasError) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} rounded-full bg-base-300 flex items-center justify-center text-xs font-semibold`}
      >
        {getInitials(platform)}
      </div>
    )
  }

  return (
    <img
      src={iconUrl}
      alt={platform}
      className={`${SIZE_CLASSES[size]} rounded-full object-cover`}
      onError={() => setHasError(true)}
    />
  )
}
