import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { auth } from '../../../firebase'
import { useAuth } from '../../context/AuthContext'

export function AuthModal() {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const { closeAuthModal, isAuthModalOpen } = useAuth()

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setIsLoginMode(true)
    closeAuthModal()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      handleClose()
    } catch (err) {
        setError(mapFirebaseError(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  const mapFirebaseError = (code) => {
    const errorMap = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/invalid-credential': 'Email or password incorrect',
    }

    return errorMap[code] || "Something went wrong. Please try again"
  }

  return (
    <dialog className={`modal ${isAuthModalOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-xl bg-base-200">
        <button
          className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2"
          onClick={handleClose}
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold">
          {isLoginMode ? 'Sign In' : 'Create Account'}
        </h3>

        <form onSubmit={handleSubmit}>
          <label className="label">
            <span className="label-text mt-2">Email address</span>
            <input
              type="email"
              className="input input-bordered w-full mt-1"
              aria-label="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="label">
            <span className="label-text mt-2">Password</span>
            <input
              type="password"
              className="input input-bordered w-full mt-1"
              aria-label="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <div className="alert alert-error text-sm font-semibold mt-4">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading && <span className="loading loading-spinner loading-sm" />}
            {isLoginMode ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          className="btn btn-ghost text-sm text-base-content/60"
          onClick={() => {
            setIsLoginMode(prev => !prev)
            setError(null)
          }}
        >
          {isLoginMode
            ? 'Don\'t have an account? Sign up ↗'
            : 'Already have an account? Sign in ↗'}
        </button>

      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}
