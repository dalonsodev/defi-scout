import { useLoaderData, useOutletContext } from 'react-router-dom'
import { useRef, useState, useMemo } from 'react'
import { PoolTable } from '../components/pools/PoolTable'
import { PaginationControls } from '../components/common/PaginationControls'
import { useSparklines } from '../hooks/useSparklines'

const PAGE_SIZE = 40

export default function Watchlist() {
  const { pools } = useLoaderData()
  const { favoriteIds, toggleFavorite } = useOutletContext()
  const [sorting, setSorting] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [visiblePoolIds, setVisiblePoolIds] = useState(new Set())
  const tableRef = useRef(null)
  const tableScrollRef = useRef(null)

  const totalPages = Math.ceil(pools.length / PAGE_SIZE)
  const paginatedPools = pools.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const visiblePools = useMemo(() => {
    return new Set(
      pools.filter((p) => visiblePoolIds.has(p.id))
    )
  }, [pools, visiblePoolIds])

  const { sparklineData } = useSparklines({
    visiblePools,
    currentPage: 1  // No freemium gate on watchlist
  })

  if (!pools.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-base-content/50">
        <p className="text-lg font-medium">No saved pools yet.</p>
        <p className="text-sm mt-1">Star a pool from the main table to add it here.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-base-content mb-6">My Watchlist</h1>
      <div
        ref={tableRef}
        className="glass-surface -mx-4 sm:-mx-6 md:-mx-4 rounded-3xl shadow-lg"
      >
        <PoolTable
          ref={tableScrollRef}
          pools={paginatedPools}
          sparklineData={sparklineData}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          sorting={sorting}
          onSortingChange={setSorting}
          onVisiblePoolsChange={setVisiblePoolIds}
        />
          <div className="py-4">
            <PaginationControls
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
      </div>
    </div>
  )
}
