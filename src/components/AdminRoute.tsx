import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/auth" replace />
  if (!profile?.is_admin) return <Navigate to="/" replace />

  return <>{children}</>
}
