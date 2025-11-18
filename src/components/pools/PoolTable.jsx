import { useMemo, useState } from "react"
import {
   useReactTable,
   getCoreRowModel,
   getSortedRowModel,
   getFilteredRowModel,
   flexRender
} from "@tanstack/react-table"
import MiniSparkline from "../common/MiniSparkline"

export default function PoolTable({ pools }) {
   const [sorting, setSorting] = useState([
      { id: "volumeUsd1d", desc: true }
   ])

   const columns = useMemo(() => {
      return [
         {
            accessorKey: "name",
            header: "Pool",
            cell: ({ row }) => (
               <div className="font-medium text-base-content">{row.original.name}</div>
            )
         },
         {
            accessorKey: "chain",
            header: "Chain",
            cell: ({ row }) => (
               <span className="badge badge-primary badge-sm rounded-full">
                  {row.original.chain}
               </span>
            )
         },
         {
            accessorKey: "platformName",
            header: "Platform",
            cell: ({ row }) => (
               <span className="text-sm text-base-content/70">{row.original.platformName}</span>
            )
         },
         {
            accessorKey: "apyBase",
            header: "APY",
            cell: ({ row }) => (
               <div className="text-right font-semibold text-green-600">
                  {Number(row.original.apyBase || 0).toFixed(2)}%
               </div>
            )
         },
         {
            accessorKey: "tvlUsd",
            header: "TVL",
            cell: ({ row }) => (
               <div className="text-right text-base-content">
                  {row.original.tvlFormatted}
               </div>
            )
         },
         {
            accessorKey: "volumeUsd1d",
            header: "Vol (24h)",
            cell: ({ row }) => (
               <div className="text-right text-base-content">
                  {row.original.volumeFormatted}
               </div>
            )
         },
         {
            accessorKey: "sparklineIn7d",
            header: "APY (7d)",
            cell: ({ row }) => (
               row.original.sparklineIn7d
                  ? <MiniSparkline data={row.original.sparklineIn7d} />
                  : <span className="text-xs text-base-content/70">No data</span>
            )
         }
      ]
   }, [])

   const table = useReactTable({
      data: pools,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: { sorting },
      onSortingChange: setSorting
   })

   function renderHeaders() {
      return table.getHeaderGroups().map(hg => (
         <tr key={hg.id}>
            {hg.headers.map(header => (
               <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition"
               >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                     <span className="ml-1">
                        {header.column.getIsSorted() === "desc" ? "↓" : "↑"}
                     </span>
                  )}
               </th>
            ))}
         </tr>
      ))
   }

   function renderRows() {
      return table.getRowModel().rows.map(row => (
         <tr
            key={row.id}
            className="hover:bg-linear-to-r hover:from-gray-700 hover:to-gray-800 transition duration-150"
         >
            {row.getVisibleCells().map(cell => (
               <td key={cell.id} className="px-6 py-6 whitespace-nowrap text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
               </td>
            ))}
         </tr>
      ))
   }

   return (
      <div className="rounded-xl overflow-hidden bg-base-200">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300">
               <thead className="bg-linear-to-r from-bg-base-300 to-bg-base-300">
                  {renderHeaders()}
               </thead>
               <tbody className="bg-base-200 divide-y divide-base-300">
                  {renderRows()}
               </tbody>
            </table>
         </div>
      </div>
   )
}