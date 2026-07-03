import { ReactNode } from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

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
 * @returns Simple error summary view
 */
export function Error(): ReactNode {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    const errorMessage = error.data?.message ?? String(error.data || error.statusText)

    return (
      <>
        <h1>Error: {errorMessage}</h1>
        <pre>
          {error.status} - {error.statusText}
        </pre>
      </>
    )
  }

  if (error instanceof Error) {
    return (
      <>
        <h1>Application Error</h1>
        <pre>{(error as { message: string }).message}</pre>
      </>
    )
  }

  return <h1>Error: 'Unknown error occurred'</h1>
}
