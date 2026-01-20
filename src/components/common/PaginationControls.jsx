import { getVisiblePages } from "../../utils/pagination"

export function PaginationControls({
   currentPage,
   totalPages,
   onPageChange
}) {
   const visiblePages = getVisiblePages(currentPage, totalPages)

   const goToPrev = () => onPageChange(currentPage - 1)
   const goToNext = () => onPageChange(currentPage + 1)
   const goToPage = (page) => onPageChange(page)

   const isFirstPage = currentPage === 1
   const isLastPage = currentPage === totalPages

   return (
      <div className="flex items-center justify-center gap-2 py-3">

         <button 
            onClick={goToPrev}
            disabled={isFirstPage}
            className="btn btn-sm"
         >
            ←
         </button>

         {/* Mobile: Page counter */}
         <span className="md:hidden px-4">
            {currentPage} / {totalPages}
         </span>

         {/* Desktop: Page numbers */}
         <div className="hidden md:flex gap-1">
            {visiblePages.map((page, index) => {
               if (typeof page === "string") {
                  return (
                     <span 
                        key={`ellipsis-${index}`} 
                        className="px-2 flex items-center"
                     >
                           ...
                     </span>)
               }

               return (
                  <button 
                     key={page}
                     onClick={() => goToPage(page)}
                     className={`btn btn-sm ${page === currentPage ? "btn-active" : ""}`}
                  >
                     {page}
                  </button>
               )
            })}
         </div>

         <button 
            onClick={goToNext}
            disabled={isLastPage}
            className="btn btn-sm"
         >
            →
         </button>
      </div>
   )
}