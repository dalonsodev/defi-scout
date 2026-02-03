import { getVisiblePages } from '../../utils/pagination'

/**
 * UI: List Pagination Controls.
 *
 * Architecture: Hybrid approach for responsive UX:
 * - Mobile: Compact "3 / 10" counter (saves horizontal space on <450px screens)
 * - Desktop: Full page numbers with smart ellipsis (industry standard, e.g. YieldSamurai)
 *
 * Ellipsis Logic: Handled by getVisiblePages utility (shows first, last, current ±2 pages).
 * Exampe: [1, "...", 4, 5, 6, "...", 10] when currentPage=5, totalPages=10
 *
 * @param {Object} props
 * @param {number} props.currentPage - Active page index (1-based)
 * @param {number} props.totalPages - Total number of pages (calculated from dataset)
 * @param {Function} props.onPageChange - Callback triggered with new page index (1-based)
 * @returns {JSX.Element} Responsive pagination UI (counter + buttons)
 */
export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  // Smart ellipsis: [1, "...", current-2, current-1, current, current+1, current+2, "...", last]
  const visiblePages = getVisiblePages(currentPage, totalPages)

  const goToPrev = () => onPageChange(currentPage - 1)
  const goToNext = () => onPageChange(currentPage + 1)
  const goToPage = (page) => onPageChange(page)

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <button onClick={goToPrev} disabled={isFirstPage} className="btn btn-sm">
        ←
      </button>

      {/* Mobile: Compact counter */}
      <span className="md:hidden px-4">
        {currentPage} / {totalPages}
      </span>

      {/* Desktop: Full numeric navigation with ellipsis */}
      <div className="hidden md:flex gap-1">
        {visiblePages.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 flex items-center"
              >
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
            >
              {page}
            </button>
          )
        })}
      </div>

      <button onClick={goToNext} disabled={isLastPage} className="btn btn-sm">
        →
      </button>
    </div>
  )
}
