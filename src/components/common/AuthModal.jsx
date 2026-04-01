import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../../../firebase'
import { useAuth } from '../../context/AuthContext'

const MODE = Object.freeze({
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot'
})

const mapFirebaseError = (code) => {
  const errorMap = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-email': 'Invalid email address',
    'auth/invalid-credential': 'Email or password incorrect',
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/too-many-requests': 'Too many attempts. Try again later'
  }

  return errorMap[code] || "Something went wrong. Please try again"
}

const googleProvider = new GoogleAuthProvider()

export function AuthModal() {
  const [mode, setMode] = useState(MODE.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const { closeAuthModal, isAuthModalOpen } = useAuth()

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setMode(MODE.LOGIN)
    setResetSent(false)
    closeAuthModal()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === MODE.LOGIN) {
        await signInWithEmailAndPassword(auth, email, password)
      } else if (mode === MODE.SIGNUP) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await sendPasswordResetEmail(auth, email)
        setResetSent(true)
        return
      }
      handleClose()
    } catch (err) {
        setError(mapFirebaseError(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await signInWithPopup(auth, googleProvider)
      handleClose()
    } catch (err) {
      setError(mapFirebaseError(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <dialog className={`modal ${isAuthModalOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-xl glass-modal rounded-2xl">
        <button
          className="btn btn-ghost btn-sm btn-circle btn-glass absolute right-2 top-2"
          onClick={handleClose}
        >
          ✕
        </button>

        <h3 className="text-2xl font-bold text-center p-4">
          {mode === MODE.LOGIN
            ? 'Welcome'
            : mode === MODE.SIGNUP
              ? 'Create Account'
              : 'Reset Password'}
        </h3>

        <form onSubmit={handleSubmit}>
          {resetSent ? (
            <>
              <div className="alert alert-success text-sm font-semibold mt-4">Check your inbox</div>
              <button
                type="button"
                className="btn btn-ghost text-sm text-base-content/60 mt-4 block mx-auto"
                onClick={() => {
                  setMode(MODE.LOGIN)
                  setResetSent(false)
                }}
              >
                Back to log in
              </button>
            </>
          ) : (
            <>
              <label
                htmlFor="email"
                className="label flex flex-col items-start mb-2"
              >
                <span className="label-text mt-2">Email address</span>
              </label>

              <input
                id="email"
                type="email"
                className="input glass-input w-full mt-1 rounded-xl"
                aria-label="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {(mode === MODE.LOGIN || mode === MODE.SIGNUP) && (
                <>
                  <label
                    htmlFor="password"
                    className="label flex flex-col items-end mb-2"
                  >
                    <div className="flex justify-between w-full mt-4">
                      <span className="label-text mt-2">Password</span>
                      {mode === MODE.LOGIN && (
                        <button
                          type="button"
                          className="link-primary -mb-2"
                          onClick={() => setMode(MODE.FORGOT)}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                  </label>

                  <input
                    id="password"
                    type="password"
                    className="input glass-input w-full mt-1 rounded-xl"
                    aria-label="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              )}

              {error && (
                <div className="alert alert-error text-sm font-semibold mt-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full mt-4 rounded-xl"
                disabled={isLoading}
              >
                {isLoading && <span className="loading loading-spinner loading-sm" />}
                {mode === MODE.LOGIN
                  ? 'Log In'
                  : mode === MODE.FORGOT
                    ? 'Send reset email'
                    : 'Create Account'}
              </button>

              {mode === MODE.FORGOT ? (
                <button
                  type="button"
                  className="btn btn-ghost text-sm text-base-content/60 mt-4 block mx-auto"
                  onClick={() => {
                    setMode(MODE.LOGIN)
                    setResetSent(false)
                  }}
                >
                  Back to log in
                </button>
              ) : (
                <>
                  <div className="divider text-base-content my-8">OR</div>

                  <button
                    type="button"
                    className="btn btn-outline w-full mb-2 btn-glass rounded-xl"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-2">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C40.483,35.58,44,30.222,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-glass rounded-xl text-sm text-base-content/60 mt-4 block mx-auto"
                    onClick={() => {
                      setMode(mode === MODE.LOGIN ? MODE.SIGNUP : MODE.LOGIN)
                      setError(null)
                    }}
                  >
                    {mode === MODE.LOGIN
                      ? 'Don\'t have an account? Sign up ↗'
                      : 'Already have an account? Log in ↗'
                    }
                  </button>
                </>
              )}
            </>
          )}
        </form>

      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}
