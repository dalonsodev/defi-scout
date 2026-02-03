/**
 * Utility: Generates an inclusive integer secuence [start, end].
 * Helper for range-based UI components (pagination, sliders).
 * @param {number} start - First integer in sequence
 * @param {number} end - Last integer in sequence (inclusive)
 * @returns {number} Array of consecutive integers
 */
export function range(start, end) {
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

/**
 * Utility: Generate vivible page numbers with ellipsis truncation.
 *
 * Design Decision: Uses delta=2 (shows 5 pages around current) following
 * industry patterns (Stripe, GitHub). Trade-off: More pages = less ellipsis
 * jumps, but wider pagination bar.
 *
 * Algorithm: Collapses left/right/both sides depending on current position
 * to keep UI compact while preserving context around active page.
 *
 * @param {number} current - Active page (1-indexed)
 * @param {number} total - Total page count
 * @param {number} [delta=2] - Radius around current page (2 = shows 5 pages)
 * @returns {(number|string)[]} Array with numbers and "..." placeholders
 *
 * @example
 * getVisiblePages(1, 20)    // [1, 2, 3, 4, 5, "...", 20]
 * getVisiblePages(10, 20)   // [1, "...", 8, 9, 10, 11, 12, "...", 20]
 * getVisiblePages(5, 8)     // [1, 2, 3, 4, 5, 6, 7, 8] (no truncation)
 */
export function getVisiblePages(current, total, delta = 2) {
  // Scenario 1: Total pages fit without truncation
  // Calculation: (delta * 2) + current + first/last + 2 separators = 5 + 2 * delta
  if (total <= 2 * delta + 5) {
    return range(1, total)
  }

  const left = current - delta
  const right = current + delta

  // Scenario 2: Current page near start → Collapse right side only
  if (left <= 3) {
    return [...range(1, right + 2), '...', total]
  }

  // Scenario 3: Current page near end → Collapse left side only
  if (right >= total - 2) {
    return [1, '...', ...range(left - 2, total)]
  }

  // Scenario 4: Current page in middle → Collapse both sides
  return [1, '...', ...range(left, right), '...', total]
}
