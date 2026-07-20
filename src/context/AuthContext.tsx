import { onAuthStateChanged, signOut } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../../firebase'
import type { User } from 'firebase/auth'
import type { ReactNode } from 'react'

interface AuthContextValue {
  currentUser: User | false | null
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [currentUser, setCurrentUser] = useState<User | false | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? false)
    })

    return () => unsubscribe()
  }, [])

  const openAuthModal = () => setIsAuthModalOpen(true)
  const closeAuthModal = () => setIsAuthModalOpen(false)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
