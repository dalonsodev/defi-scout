import { RouterProvider } from 'react-router-dom'
import { AuthModal } from './components/common/AuthModal'
import { BackgroundVisuals } from './components/layout/BackgroundVisuals'
import { AuthProvider } from './context/AuthContext'
import { router } from './router'
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
