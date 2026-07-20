import { useLoaderData, useOutletContext } from 'react-router-dom'
import { PoolsContent } from '../components/pools/PoolsContent'
import { usePoolFilters } from '../hooks/usePoolFilters'
import type { ReactNode } from 'react'
import type { FavoritesOutletContext } from '../components/layout/FavoritesLayout'
import type { FormattedPool } from '../types'

/**
 * UI: Market Pools Explorer
 * Entry point for the liquidity pools discovery interface
 * Connects router data with global filtering logic
 */
export default function Pools(): ReactNode {
  const { pools } = useLoaderData() as { pools: FormattedPool[] }

  const { filters, updateFilter, togglePlatform, clearFilters } = usePoolFilters()
  const { favoriteIds, toggleFavorite } = useOutletContext() as FavoritesOutletContext

  return (
    <div className="mx-auto max-w-7xl">
      <title>Explore DeFi Pools | DeFi Scout</title>
      {/* SECTION: Header and context */}
      <header className="px-4 pt-8 pb-2 md:p-4">
        <h1 className="text-3xl font-bold">Explore Pools</h1>
      </header>

      {/* SECTION: Data orchestration */}
      <PoolsContent
        pools={pools}
        filters={filters}
        favoriteIds={favoriteIds}
        updateFilter={updateFilter}
        togglePlatform={togglePlatform}
        clearFilters={clearFilters}
        toggleFavorite={toggleFavorite}
      />
    </div>
  )
}
