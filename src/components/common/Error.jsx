import { useRouteError } from "react-router-dom"

/**
 * UI: Global Route Error Boundary.
 * 
 * Architecture: Captures routing errors (404, loader failures, 500s) using React
 * Router's error hook. Centralized approach means ONE error UI for all routes
 * instead of duplicating per-page error handling.
 * 
 * Trade-off: Shows generic error screen vs route-specific messages. Acceptable for
 * this app size (<10 routes), but enterprise apps might need granular error types.
 * 
 * Limitations:
 * - Only displays error.message/status (no stack trace for security)
 * - No automatic retry mechanism (user must manually navigate)
 * 
 * @returns {JSX.Element} Simple error summary view
 */
export function Error() {
   const error = useRouteError()

   return (
      <>
         <h1>Error: {error.message}</h1>
         <pre>{error.status} - {error.statusText}</pre>
      </>
   )
}
