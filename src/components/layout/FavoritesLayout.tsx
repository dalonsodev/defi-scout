import { Outlet } from 'react-router-dom'
import { useFavorites } from '../../hooks/useFavorites'
import type { ReactNode } from 'react'

export interface FavoritesOutletContext {
  favoriteIds: Set<string>
  toggleFavorite: (poolId: string) => Promise<void>
  isLoggedIn: boolean
}

export function FavoritesLayout(): ReactNode {
  const { favoriteIds, toggleFavorite, isLoggedIn } = useFavorites()

  return <Outlet context={{ favoriteIds, toggleFavorite, isLoggedIn }} />
}
