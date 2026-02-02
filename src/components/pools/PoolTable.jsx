import { useMemo, createRef, useEffect, forwardRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
   useReactTable,
   getCoreRowModel,
   getFilteredRowModel,
   flexRender
} from "@tanstack/react-table"
import { MiniSparkline } from "../common/MiniSparkline"
import { PlatformIcon } from "../common/PlatformIcon"
import { useBreakpoint } from "../../hooks/useBreakpoint"
import { useIntersection } from "../../hooks/useIntersection"

/**
 * Z-INDEX HIERARCHY (Critical for sticky positioning):
 * z-2: Body cells (sticky first column on horizontal scroll)
 * z-10: Header cells (sticky on vertical scroll)
 * z-11: Header-body intersection (top-left corner, both sticky directions)
 * z-20: UI overlays (dropdowns, tooltips, modals)
 */

/**
 * Component: High-Performance Pool Data Grid
 *
 * Performance Optimizations:
 * - IntersectionObserver: Lazy-loads sparklines for visible rows only (prevents 8k API calls)
 * - manualSorting: true: Disables TanStack auto-sort (already handled by sortPools utility in parent)
 * - Sticky headers with internal scroll: Keeps column labels visible during vertical navigation
 *
 * CSS Limitation: Sticky positioning breaks with overflow ancestors (must use internal scroll container).
 * Solution: max-h-[840px] wrapper with overflow-y-auto, not body scroll.
 *
 * Accessibility: CMD/CTRL+click on rows opens detail page in new tab (power user feature)
 *
 * @param {Object} props
 * @param {Array<Object>} props.pools - Paginated pool dataset (40 items max)
 * @param {Object<string, Array<number>>} props.sparklineData - Cache of historical APY data by pool ID
 * @param {Function} props.onVisiblePoolsChange - Callback to notify parent of IDs in viewport
 * @param {Array<id: string, desc: boolean>} props.sorting - TanStack sorting state
 * @param {Function} props.onSortingChange - Handler to update sorting criteria
 * @param {React.ForwardedRef<HTMLDivElement[lang="en"]>} ref - Ref to internal scroll container (for auto-scroll)
 * @returns {JSX.Element}
 */
const PoolTable = forwardRef(({
   pools,
   sparklineData,
   onVisiblePoolsChange,
   sorting,
   onSortingChange
}, ref) => {

   const { isDesktop } = useBreakpoint()
   const navigate = useNavigate()

   const rowRefs = useMemo(() => {
      return pools.map(() => createRef())
   }, [pools])

   const visiblePoolIds = useIntersection(rowRefs, {
      threshold: 0.1,
      rootMargin: "200px"
   })

   useEffect(() => {
      if (onVisiblePoolsChange) {
         onVisiblePoolsChange(visiblePoolIds)
      }
   }, [visiblePoolIds, onVisiblePoolsChange])

   const columns = useMemo(() => {
      return [
         {
            accessorKey: "name",
            header: "Pool",
            meta: { showOn: "both", isSticky: true },
            cell: ({ row }) => (
               <Link
                  to={`/pools/${row.original.id}`}
                  className="block"
                  aria-label={`View details for ${row.original.name} pool`}
               >
                  <div className="tooltip tooltip-right" data-tip={row.original.name}>
                     <div className="font-medium text-base-content max-w-[120px] truncate">
                        {row.original.name}
                     </div>
                  </div>
               </Link>
            )
         },
         {
            accessorKey: "apyBase",
            header: "APY",
            meta: { showOn: "both" },
            cell: ({ row }) => (
               <div className="text-right font-semibold text-green-600">
                  {Number(row.original.apyBase || 0).toFixed(2)}%
               </div>
            )
         },
         {
            accessorKey: "tvlUsd",
            header: "TVL",
            meta: { showOn: "both" },
            cell: ({ row }) => (
               <div className="text-right text-base-content">
                  ${row.original.tvlFormatted}
               </div>
            )
         },
         {
            accessorKey: "volumeUsd1d",
            header: "Vol (24h)",
            meta: { showOn: "both" },
            cell: ({ row }) => (
               <div className="text-right text-base-content">
                  ${row.original.volumeFormatted}
               </div>
            )
         },
         {
            accessorKey: "sparklineIn7d",
            header: "APY (7d)",
            meta: { showOn: "both" },
            cell: ({ row }) => {
               const data = sparklineData?.[row.original.id]

               if (!data) {
                  return (
                     <div className="flex justify-center">
                        <div
                           className="tooltip tooltip-left cursor-help py-2.5"
                           data-tip="Upgrade to Pro for unlimited sparklines"
                        >
                           <span className="text-xs text-base-content/40 font-medium min-h-10">
                              ⟢ Pro
                           </span>
                        </div>
                     </div>
                  )
               }
               return <MiniSparkline data={data} />
            }
         },
         {
            accessorKey: "chain",
            header: "Chain",
            meta: { showOn: "desktop" },
            cell: ({ row }) => (
               <span className="badge badge-primary badge-sm rounded-l-lg">
                  {row.original.chain}
               </span>
            )
         },
         {
            id: "platformIconOnly",
            header: "DEX",
            meta: { showOn: "mobile" },
            cell: ({ row }) => (
               <PlatformIcon
                  platform={row.original.project}
                  size="md"
               />
            )
         },
         {
            accessorKey: "platformName",
            header: "Platform",
            meta: { showOn: "desktop" },
            cell: ({ row }) => (
               <div className="flex items-center gap-2">
                  <PlatformIcon
                     platform={row.original.project}
                     size="md"
                  />
                  <span className="text-sm text-base-content/70">
                     {row.original.platformName}
                  </span>
               </div>
            )
         }
      ]
   }, [sparklineData])

   const visibleColumns = useMemo(() => {
      return columns.filter(col => {
         const showOn = col.meta?.showOn

         if (!showOn) return true

         if (showOn === "both") return true
         if (showOn === "mobile" && !isDesktop) return true
         if (showOn === "desktop" && isDesktop) return true

         return false
      })
   }, [columns, isDesktop])

   const table = useReactTable({
      data: pools,
      columns: visibleColumns,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: { sorting },
      onSortingChange: onSortingChange,
      manualSorting: true
   })

   /**
    * Renders sticky table headers with sort controls.
    * Uses flexRender (TanStack utility) instead of manual JSX to preserve
    * column metadata (accessorKey, custom cell renderers).
    */
   function renderHeaders() {
      return table.getHeaderGroups().map(hg => (
         <tr key={hg.id}>
            {hg.headers.map(header => {
               const isSticky = header.column.columnDef.meta?.isSticky

               return (
                  <th
                     key={header.id}
                     onClick={header.column.getToggleSortingHandler()}
                     className={`sticky top-0 z-10 bg-base-300 px-6 py-4 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider cursor-pointer hover:bg-base-300 transition
                        ${isSticky ? "left-0 z-11 sticky-column-shadow" : ""}
                     `.trim()}
                  >
                     {flexRender(header.column.columnDef.header, header.getContext())}
                     {header.column.getIsSorted() && (
                        <span className="ml-1">
                           {header.column.getIsSorted() === "desc" ? "↓" : "↑"}
                        </span>
                     )}
                  </th>
               )
            })}
         </tr>
      ))
   }

   /**
    * Render table rows with IntersectionObserver refs for lazy sparkline loading.
    * Supports CMD/CTRL+click for opening detail pages in new tabs.
    */
   function renderRows() {
      return table.getRowModel().rows.map((row, i) => {
         const poolId = row.original.id

         const handleRowClick = (e) => {
            // Don't navigate if user is selecting text
            if (window.getSelection().toString()) return

            // Don't navigate if clicking on a link (prevents double navigation)
            if (e.target.closest("a")) return

            // CMD/CTRL+click: Open in new tab (power user feature)
            if (e.metaKey || e.ctrlKey) {
               window.open(`/pools/${poolId}`, "_blank")
            } else {
               navigate(`/pools/${poolId}`)
            }
         }

         return (
            <tr
               key={row.id}
               ref={rowRefs[i]}
               data-pool-id={row.original.id}
               onClick={handleRowClick}
               className="group hover:bg-base-300/30 transition-colors duration-150 cursor-pointer"
            >
               {row.getVisibleCells().map(cell => {
                  const isSticky = cell.column.columnDef.meta?.isSticky

                  return (
                     <td
                        key={cell.id}
                        className={`px-4 py-6 whitespace-nowrap text-sm
                           ${isSticky ? "sticky left-0 bg-base-200 sticky-column-shadow group-hover:bg-base-200/20 z-2 transition-colors duration-150" : ""}
                        `.trim()}
                     >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                     </td>
                  )
               })}
            </tr>
         )
      })
   }

   return (
      <div
         ref={ref}
         className="overflow-x-auto scrollbar-hide rounded-t-3xl max-h-[592px] md:max-h-[840px]"
      >
         <table className="min-w-full divide-y divide-base-300 border-separate border-spacing-0">
            <thead className="bg-base-300">
               {renderHeaders()}
            </thead>
            <tbody className="bg-base-200 divide-y divide-base-300">
               {renderRows()}
            </tbody>
         </table>
      </div>
   )
})

PoolTable.displayName = "PoolTable"

export { PoolTable }
