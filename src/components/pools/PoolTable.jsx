import { useMemo, createRef, useEffect, forwardRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table'
import { baseColumns } from '../../data/tableColumns'
import { SparklineCell } from './cells/SparklineCell'
import { PlatformIcon } from '../common/PlatformIcon'
import { OutlinedStarIcon, FilledStarIcon } from '../common/StarIcons'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useIntersection } from '../../hooks/useIntersection'

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
 * @param {Set<string>} props.favoriteIds - Favorited pool IDs; used for O(1) isFavorited lookup
 * @param {(poolId: string) => Promise<void>} props.toggleFavorite - Toggles favorite; opens auth modal if unauthenticated
 * @returns {JSX.Element}
 */
const PoolTable = forwardRef(
  (
    {
      pools,
      sparklineData,
      onVisiblePoolsChange,
      sorting,
      onSortingChange,
      favoriteIds,
      toggleFavorite,
      from
    },
    ref
  ) => {
    const { isDesktop } = useBreakpoint()
    const navigate = useNavigate()

    const rowRefs = useMemo(() => {
      return pools.map(() => createRef())
    }, [pools])

    const visiblePoolIds = useIntersection(rowRefs, {
      threshold: 0.1,
      rootMargin: '200px'
    })

    useEffect(() => {
      if (onVisiblePoolsChange) {
        onVisiblePoolsChange(visiblePoolIds)
      }
    }, [visiblePoolIds, onVisiblePoolsChange])

    const columns = useMemo(() => {
      return baseColumns.map((col) => {
        if (col.accessorKey === 'name') {
          return {
            ...col,
            cell: ({ row }) => {
              const isFavorited = favoriteIds.has(row.original.id)

              return (
                <div className="flex items-center gap-2">
                  <div
                    className="tooltip tooltip-right"
                    data-tip={`${isFavorited ? 'Remove from' : 'Add to'} Watchlist`}
                  >
                    <button
                      className="btn btn-ghost btn-circle btn-sm"
                      aria-label={`${isFavorited ? 'Remove from' : 'Add to'} Watchlist`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(row.original.id)
                      }}
                    >
                      {isFavorited ? <FilledStarIcon /> : <OutlinedStarIcon />}
                    </button>
                  </div>

                  <Link
                    to={`/pools/${row.original.id}`}
                    state={{ from }}
                    className="flex items-center gap-2"
                    aria-label={`View details for ${row.original.name} pool`}
                  >
                    <div
                      className="tooltip tooltip-right"
                      data-tip={row.original.name}
                    >
                      <div className="text-base-content max-w-[120px] truncate font-medium">
                        {row.original.name}
                      </div>
                    </div>

                    <span className="badge badge-sm text-base-content/60 btn-glass">
                      {row.original.feeTierFormatted}
                    </span>
                  </Link>
                </div>
              )
            }
          }
        }

        if (col.accessorKey === 'apyBase') {
          return {
            ...col,
            cell: ({ row }) => (
              <div className="text-success text-right font-semibold">
                {Number(row.original.apyBase || 0).toFixed(2)}%
              </div>
            )
          }
        }

        if (col.accessorKey === 'tvlUsd') {
          return {
            ...col,
            cell: ({ row }) => (
              <div className="text-base-content text-right">
                ${row.original.tvlFormatted}
              </div>
            )
          }
        }

        if (col.accessorKey === 'volumeUsd1d') {
          return {
            ...col,
            cell: ({ row }) => (
              <div className="text-base-content text-right">
                ${row.original.volumeFormatted}
              </div>
            )
          }
        }

        if (col.accessorKey === 'sparklineIn7d') {
          return {
            ...col,
            cell: ({ row }) => (
              <SparklineCell
                poolId={row.original.id}
                sparklineData={sparklineData}
              />
            )
          }
        }

        if (col.accessorKey === 'chain') {
          return {
            ...col,
            cell: ({ row }) => (
              <span className="badge glass-surface text-primary border-0">
                {row.original.chain}
              </span>
            )
          }
        }

        if (col.id === 'platformIconOnly') {
          return {
            ...col,
            cell: ({ row }) => (
              <PlatformIcon platform={row.original.project} size="md" />
            )
          }
        }

        if (col.accessorKey === 'platformName') {
          return {
            ...col,
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <PlatformIcon platform={row.original.project} size="md" />
                <span className="text-base-content/70 text-sm">
                  {row.original.platformName}
                </span>
              </div>
            )
          }
        }

        return col
      })
    }, [sparklineData, favoriteIds, toggleFavorite, from])

    const visibleColumns = useMemo(() => {
      return columns.filter((col) => {
        const showOn = col.meta?.showOn

        if (!showOn) return true

        if (showOn === 'both') return true
        if (showOn === 'mobile' && !isDesktop) return true
        if (showOn === 'desktop' && isDesktop) return true

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
      return table.getHeaderGroups().map((hg) => (
        <tr key={hg.id}>
          {hg.headers.map((header) => {
            const isSticky = header.column.columnDef.meta?.isSticky
            const tooltipText = header.column.columnDef.meta?.tooltip

            return (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                style={{ width: header.column.getSize() }}
                className={`
                  sticky top-0 z-10 bg-(--table-header-bg)
                  px-6 py-4 text-xs font-semibold tracking-wider uppercase text-base-content/60
                  cursor-pointer transition hover:bg-(--table-header-bg) has-[.tooltip:hover]:z-20
                  ${isSticky ? 'sticky-column-shadow left-0 z-11 pl-4 text-left' : ''}
                `.trim()}
              >
                <div
                  className={`
                    flex items-center gap-1 whitespace-nowrap
                    ${isSticky ? 'justify-start' : 'justify-center'}
                  `}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}

                  {header.column.getIsSorted() && (
                    <span>
                      {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                    </span>
                  )}

                  {tooltipText && (
                    <span
                      className="tooltip tooltip-bottom text-base-content/60 text-sm"
                      data-tip={tooltipText}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⓘ
                    </span>
                  )}
                </div>
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
          if (e.target.closest('a')) return

          // CMD/CTRL+click: Open in new tab (power user feature)
          if (e.metaKey || e.ctrlKey) {
            window.open(`/pools/${poolId}`, '_blank')
          } else {
            navigate(`/pools/${poolId}`, { state: { from } })
          }
        }

        return (
          <tr
            key={row.id}
            ref={rowRefs[i]}
            data-pool-id={row.original.id}
            onClick={handleRowClick}
            className="group cursor-pointer transition-colors duration-150 hover:bg-white/4"
          >
            {row.getVisibleCells().map((cell) => {
              const isSticky = cell.column.columnDef.meta?.isSticky

              return (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className={`px-4 py-6 text-sm whitespace-nowrap ${isSticky ? 'sticky-column-shadow sticky left-0 z-2 bg-(--table-sticky-bg) transition-colors duration-150 group-hover:bg-(--table-sticky-hover-bg)' : ''} `.trim()}
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
        className="scrollbar-hide max-h-[592px] overflow-x-auto rounded-t-3xl md:max-h-[840px]"
      >
        <table className="divide-base-300 min-w-full border-separate border-spacing-0 divide-y">
          <thead className="bg-(--table-header-bg)">{renderHeaders()}</thead>
          <tbody className="divide-y divide-(--table-divider) bg-(--table-body-bg)">
            {renderRows()}
          </tbody>
        </table>
      </div>
    )
  }
)

PoolTable.displayName = 'PoolTable'

export { PoolTable }
