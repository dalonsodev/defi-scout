import { useMemo, useState } from "react"
import {
   useReactTable,
   getCoreRowModel,
   getSortedRowModel,
   getFilteredRowModel,
   flexRender
} from "@tanstack/react-table"
import MiniSparkline from "../common/MiniSparkline"
import PlatformIcon from "../common/PlatformIcon"
import useBreakpoint from "../../hooks/useBreakpoint"

export default function PoolTable({ pools }) {
   const { isDesktop } = useBreakpoint()

   const [sorting, setSorting] = useState([
      { id: "volumeUsd1d", desc: true }
   ])

   const columns = useMemo(() => {
      return [
         {
            accessorKey: "name",
            header: "Pool",
            meta: { showOn: "both", isSticky: true },
            cell: ({ row }) => (
               <div className="font-medium text-base-content max-w-30">
                  {row.original.name}
               </div>
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
                  {row.original.tvlFormatted}
               </div>
            )
         },
         {
            accessorKey: "volumeUsd1d",
            header: "Vol (24h)",
            meta: { showOn: "both" },
            cell: ({ row }) => (
               <div className="text-right text-base-content">
                  {row.original.volumeFormatted}
               </div>
            )
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
         },
         {
            accessorKey: "riskLevel",
            header: "Risk",
            meta: { showOn: "desktop" },
            cell: ({ row }) => {
               const risk = row.original.riskLevel
               const colorMap = {
                  Low: "badge-success",
                  Medium: "badge-warning",
                  High: "badge-error"
               }
               return (
                  <span
                     className={`badge badge-sm ${colorMap[risk] || "badge-ghost"}`}
                  >
                     {risk}
                  </span>
               )
            }
         },
         {
            accessorKey: "sparklineIn7d",
            header: "APY (7d)",
            meta: { showOn: "desktop" },
            cell: ({ row }) => (
               row.original.sparklineIn7d
                  ? <MiniSparkline data={row.original.sparklineIn7d} />
                  : <span className="text-xs text-base-content/70">No data</span>
            )
         }
      ]
   }, [])

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
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: { sorting },
      onSortingChange: setSorting
   })

   function renderHeaders() {
      return table.getHeaderGroups().map(hg => (
         <tr key={hg.id}>
            {hg.headers.map(header => {
               const isSticky = header.column.columnDef.meta?.isSticky
               
               return (
                  <th
                     key={header.id}
                     onClick={header.column.getToggleSortingHandler()}
                     className={`px-6 py-4 text-left text-xs font-semibold text-base-content/50 uppercase tracking-wider cursor-pointer hover:bg-base-300 transition
                        ${isSticky ? "sticky left-0 bg-base-300 z-3 sticky-column-shadow" : ""}
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

   function renderRows() {
      return table.getRowModel().rows.map(row => (
         <tr
            key={row.id}
            className="hover:bg-base-300/30 transition-colors duration-150 cursor-pointer"
         >
            {row.getVisibleCells().map(cell => {
               const isSticky = cell.column.columnDef.meta?.isSticky

               return (
                  <td 
                     key={cell.id} 
                     className={`px-4 py-6 whitespace-nowrap text-sm
                        ${isSticky ? "sticky left-0 bg-base-200 z-2 sticky-column-shadow" : ""}
                     `.trim()}
                  >
                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
               )
            })}
         </tr>
      ))
   }

   return (
      <div className="overflow-x-auto scrollbar-hide">
         <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-300">
               {renderHeaders()}
            </thead>
            <tbody className="bg-base-200 divide-y divide-base-300">
               {renderRows()}
            </tbody>
         </table>
      </div>
   )
}