import { Outlet, useNavigation, Link } from 'react-router-dom'
import { Navbar } from './Navbar'

/**
 * Architecture: Global Application Layout Wrapper.
 *
 * Design Decision: Centralized loading state using React Router's useNavigation
 * instead of per-component loaders. This provides a consistent UX across all
 * route transitions without prop drilling or context providers.
 *
 * Trade-off: Shows loading spinner for ALL navigation (not route specific)
 * Acceptable for this app's data volume (<10MB deferred pool data), but enterprise
 * apps might need granular loading states per section.
 *
 * UI Constraints:
 * - max-w-5xl: Optimal line length for financial data tables (prevents horizontal
 * eye strain on ultra-wide monitors, follows Nielsen Norman Group guidelines)
 * - Fixed spinner (top-right): Non-blocking, doesn't shift layout on show/hide
 *
 * @returns {JSX.Element} Global site structure: navbar + route outlet + loading indicator
 */
export function Layout() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  return (
    <div className="site-wrapper max-w-5xl mx-auto">
      <Navbar />
      <main className="min-h-screen p-0 sm:px-2 md:p-6">
        {isLoading && (
          <div className="fixed top-20 right-4 z-50">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
        <Outlet />
      </main>
      <footer className="glass-surface border-t-(--border-subtle) w-full md:rounded-t-3xl">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 px-6">
          <Link to="/" className="btn btn-ghost text-sm text-primary rounded-xl">
            DeFi Scout
          </Link>
          <div className="flex gap-6 items-center">
            <a
              href="https://thegraph.com/"
              className="text-xs text-muted hover:text-primary transition"
              target="_blank"
              rel="noopener noreferrer"
            >
                Data by The Graph</a>
            <a
              href="https://github.com/dalonsodev/defi-scout"
              className="text-muted hover:text-primary transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
