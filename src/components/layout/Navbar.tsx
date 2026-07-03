import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
 */
export function Navbar(): ReactNode {
  const { currentUser, openAuthModal, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={`
      navbar glass-surface sticky top-2 z-50
      mx-2 mt-2 w-auto rounded-full px-0 sm:px-2
      md:top-0 md:mx-0 md:mt-0 md:w-full md:rounded-none md:rounded-b-3xl md:px-2
    `}>
      <div className="ml-3.5 flex-1 md:ml-2">
        {/* Brand: Site logo */}
        <Link
          to="/"
          className="rounded-full transition-opacity hover:opacity-80 md:ml-0 md:rounded-xl"
        >
          <img
            src="/defi-scout-logo.svg"
            alt="DeFiScout logo"
            width="130"
            height="50"
          />
        </Link>
      </div>
      <div className="flex flex-none items-center gap-2 pr-2">
        {/* Primary routes: Ghost buttons for understated navigation */}
        <Link to="/" className="btn btn-ghost rounded-xl">
          Pools
        </Link>

        {currentUser === null && (
          <div className="loading loading-spinner loading-sm"></div>
        )}

        {currentUser === false && (
          <button
            className="btn btn-sm btn-primary mr-1 rounded-full md:rounded-xl"
            onClick={openAuthModal}
          >
            Login / Signup
          </button>
        )}

        {currentUser && (
          <div className="relative flex" ref={dropdownRef}>
            <div className="flex flex-col">
              <button
                className="btn btn-md md:btn-sm btn-ghost btn-circle mr-1"
                onClick={() => setIsOpen(prev => !prev)}
              >
                {currentUser.photoURL ? (
                  <img
                    className="avatar h-7 w-7 rounded-full"
                    src={currentUser.photoURL}
                    alt="User avatar"
                  />
                ) : (
                  <svg
                    className="avatar avatar-placeholder"
                    xmlns="http://www.w3.org/2000/svg"
                    width="2.5em"
                    height="2.5em"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12S6.201 22.5 12 22.5S22.5 17.799 22.5 12S17.799 1.5 12 1.5M2.5 12a9.5 9.5 0 1 1 16.4 6.53a4.64 4.64 0 0 0-1.219-2.381c-.743-.774-1.679-1.228-2.501-1.484c-.527-.164-1.037.023-1.39.26c-.383.259-1.013.575-1.79.575s-1.407-.316-1.79-.574c-.353-.239-.863-.425-1.39-.261c-.822.256-1.758.71-2.501 1.484a4.64 4.64 0 0 0-1.22 2.38A9.47 9.47 0 0 1 2.5 12m3.505 7.37c.056-1.14.476-1.947 1.035-2.528c.59-.615 1.36-.999 2.078-1.223c.128-.04.319-.009.533.136c.477.322 1.302.745 2.349.745s1.872-.423 2.349-.745c.214-.145.405-.176.533-.136c.719.224 1.487.608 2.078 1.223c.559.58.979 1.389 1.035 2.528A9.46 9.46 0 0 1 12 21.5a9.46 9.46 0 0 1-5.995-2.13M9.5 10c0-1.385 1.08-2.5 2.5-2.5s2.5 1.115 2.5 2.5s-1.08 2.5-2.5 2.5s-2.5-1.114-2.5-2.5M12 6.5A3.47 3.47 0 0 0 8.5 10c0 1.928 1.519 3.5 3.5 3.5s3.5-1.572 3.5-3.5s-1.519-3.5-3.5-3.5"
                    />
                  </svg>
                )}
              </button>

              {isOpen && (
                <div className={`
                  glass-overlay absolute top-full right-0 z-50 mt-2
                  flex flex-col items-center gap-2 rounded-xl p-4
                  md:gap-0 md:p-2
                `}>
                  <Link
                    to="/watchlist"
                    className="btn btn-ghost rounded-xl text-lg md:text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Watchlist
                  </Link>
                  <button
                    className="btn btn-ghost text-md rounded-xl whitespace-nowrap text-red-500 md:text-xs"
                    onClick={logout}
                  >
                    Log out
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.25em"
                      height="1.25em"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m22 12l-4-4v3h-8v2h8v3m2 2a10 10 0 1 1 0-12h-2.73a8 8 0 1 0 0 12Z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
