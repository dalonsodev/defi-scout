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
      const formatUsd = (value) => {
         const num = Number(value || 0)
         return `$${num.toLocaleString()}`
      }

      return [
         {
            accessorKey: "name",
            header: "Pool",
            cell: ({ row }) => (
               <div className="font-medium text-gray-900">{row.original.name}</div>
            )
         },
         {
            accessorKey: "chain",
            header: "Chain",
            cell: ({ row }) => (
               <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {row.original.chain}
               </span>
            )
         },
         {
            accessorKey: "platformName",
            header: "Platform",
            cell: ({ row }) => (
               <span className="text-sm text-gray-700">{row.original.platformName}</span>
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
               <div className="text-right text-gray-900">
                  {formatUsd(row.original.tvlUsd)}
               </div>
            )
         },
         {
            accessorKey: "volumeUsd1d",
            header: "Vol (24h)",
            cell: ({ row }) => (
               <div className="text-right text-gray-900">
                  {formatUsd(row.original.volumeUsd1d)}
               </div>
            )
         },
         {
            accessorKey: "sparklineIn7d",
            header: "APY (7d)",
            cell: ({ row }) => (
               row.original.sparklineIn7d
                  ? <MiniSparkline data={row.original.sparklineIn7d} />
                  : <span className="text-xs text-gray-400">No data</span>
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition"
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
            className="hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-150"
         >
            {row.getVisibleCells().map(cell => (
               <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
               </td>
            ))}
         </tr>
      ))
   }

   return (
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
         <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                  {renderHeaders()}
               </thead>
               <tbody className="bg-white divide-y divide-gray-100">
                  {renderRows()}
               </tbody>
            </table>
         </div>
      </div>
   )
}