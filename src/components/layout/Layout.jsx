import { Outlet, useNavigation } from 'react-router-dom'
import { Navbar } from './Navbar'

/**
 * Architecture: Global Application Aayout Wrapper.
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
 * eye strain on ultrawide monitors, follows Nielsen Norman Group guidelines)
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
    </div>
  )
}
