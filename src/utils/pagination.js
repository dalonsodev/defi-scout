export function range(start, end) {
   const pages = []
   for (let i = start; i <= end; i++) {
      pages.push(i)
   }
   return pages
}

export function getVisiblePages(current, total, delta = 2) {
   if (total <= 2 * delta + 5) {
      return range(1, total)
   }

   const left = current - delta
   const right = current + delta

   if (left <= 3) {
      return [...range(1, right + 2), "...", total]
   }

   if (right >= total - 2) {
      return [1, "...", ...range(left - 2, total)]
   }

   return [1, "...", ...range(left, right), "...", total]
}