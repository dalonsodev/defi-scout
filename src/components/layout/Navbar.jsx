import { Link } from 'react-router-dom'

/**
 * UI: Global Application Header.
 *
 * Design Decisions:
 * - btn-ghost links: Low visual weight to avoid competing with page content
 *   (vs btn-primary which would over-emphasize navigation)
 * - shadow utility: Subtle depth separation from content (z-axis hierarchy)
 * - Semantic HTML: <header> for landmark navigation (accessibility + SEO)
 *
 * Responsive: Horizontal layout collapses gracefully on mobile (flex-wrap
 * handled by DaisyUI navbar component).
 *
 * Feature Enhancement: Consider active link styling with NavLink component
 * (aria-current="page" for screen readers).
 *
 * @returns {JSX.Element} Navigation bar with app branding and primary routes
 */
export function Navbar() {
  return (
    <header className="navbar bg-base-100 shadow px-0 sm:px-2 md:px-2">
      <div className="flex-1">
        {/* Brand: Larger text-xl for visual hierarchy */}
        <Link to="/" className="btn btn-ghost text-xl">
          Defi Scout
        </Link>
      </div>
      <div className="flex-none">
        {/* Primary routes: Ghost buttons for understated navigation */}
        <Link to="/" className="btn btn-ghost">
          Pools
        </Link>
        <Link to="/watchlist" className="btn btn-ghost">
          Watchlist
        </Link>
      </div>
    </header>
  )
}
