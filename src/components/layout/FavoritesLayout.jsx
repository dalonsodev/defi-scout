import { Outlet } from 'react-router-dom'
import { useFavorites } from '../../hooks/useFavorites'

export function FavoritesLayout() {
  const { favoriteIds, toggleFavorite, isLoggedIn } = useFavorites()

  return <Outlet context={{ favoriteIds, toggleFavorite, isLoggedIn }} />
}
