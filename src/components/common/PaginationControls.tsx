import { ReactNode } from 'react'
import { getVisiblePages } from '../../utils/pagination'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number | string) => void
}

/**
 * UI: List Pagination Controls.
 *
 * Architecture: Hybrid approach for responsive UX:
 * - Mobile: Compact "3 / 10" counter (saves horizontal space on <450px screens)
 * - Desktop: Full page numbers with smart ellipsis (industry standard, e.g. YieldSamurai)
 *
 * Ellipsis Logic: Handled by getVisiblePages utility (shows first, last, current ±2 pages).
 * Example: [1, "...", 4, 5, 6, "...", 10] when currentPage=5, totalPages=10
 *
 * @param props
 * @param props.currentPage - Active page index (1-based)
 * @param props.totalPages - Total number of pages (calculated from dataset)
 * @param props.onPageChange - Callback triggered with new page index (1-based)
 * @returns Responsive pagination UI (counter + buttons)
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange
}: PaginationControlsProps): ReactNode {
  // Smart ellipsis: [1, "...", current-2, current-1, current, current+1, current+2, "...", last]
  const visiblePages = getVisiblePages(currentPage, totalPages)

  const goToPrev = () => onPageChange(currentPage - 1)
  const goToNext = () => onPageChange(currentPage + 1)
  const goToPage = (page: number | string) => onPageChange(page)

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <button
        onClick={goToPrev}
        disabled={isFirstPage}
        className="btn btn-sm btn-glass rounded-xl"
      >
        ←
      </button>

      {/* Mobile: Compact counter */}
      <span className="px-4 md:hidden">
        {currentPage} / {totalPages}
      </span>

      {/* Desktop: Full numeric navigation with ellipsis */}
      <div className="hidden gap-1 md:flex">
        {visiblePages.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center px-2"
              >
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`btn btn-sm btn-glass rounded-xl ${page === currentPage ? 'btn-active' : ''}`}
            >
              {page}
            </button>
          )
        })}
      </div>

      <button
        onClick={goToNext}
        disabled={isLastPage}
        className="btn btn-sm btn-glass rounded-xl"
      >
        →
      </button>
    </div>
  )
}
