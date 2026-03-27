import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './context/AuthContext'
import { AuthModal } from './components/common/AuthModal'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <AuthModal />
    </AuthProvider>
  )
}
