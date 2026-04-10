import { useLoaderData, useOutletContext, Link } from 'react-router-dom'
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
    return new Set(pools.filter((p) => visiblePoolIds.has(p.id)))
  }, [pools, visiblePoolIds])

  const { sparklineData } = useSparklines({
    visiblePools,
    currentPage: 1 // No freemium gate on watchlist
  })

  if (!pools.length) {
    return (
      <div className="text-base-content/50 flex flex-col items-center justify-center py-32">
        <p className="text-lg font-medium">No saved pools yet.</p>
        <p className="mt-1 text-sm">
          Star a pool from the main table to add it here.
        </p>
        {/* TODO: update to "/pools" when a landing page is added at "/" */}
        <Link to="/" className="btn btn-primary mt-4 rounded-xl">
          Explore Pools
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4">
      <title>My Watchlist | DeFi Scout</title>
      <h1 className="text-base-content mb-6 text-2xl font-bold">
        My Watchlist
      </h1>
      <div
        ref={tableRef}
        className="glass-surface -mx-4 rounded-3xl shadow-lg sm:-mx-6 md:-mx-4"
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
          from="watchlist"
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
