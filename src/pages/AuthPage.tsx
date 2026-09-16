import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthPage() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const result =
      mode === 'sign-up' ? await signUp(email, password, displayName) : await signIn(email, password)

    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="auth-page">
      <p className="auth-brand">Booma</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>{mode === 'sign-up' ? 'Create an account' : 'Sign in'}</h1>

        {mode === 'sign-up' && (
          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'sign-up' ? 'Sign up' : 'Sign in'}
        </button>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}
        >
          {mode === 'sign-up' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  )
}
