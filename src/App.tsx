import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './context/AuthContext'
import { AuthModal } from './components/common/AuthModal'
import { BackgroundVisuals } from './components/layout/BackgroundVisuals'
import type { ReactNode } from 'react'

export function App(): ReactNode {
  return (
    <AuthProvider>
      <BackgroundVisuals />
      <RouterProvider router={router} />
      <AuthModal />
    </AuthProvider>
  )
}
