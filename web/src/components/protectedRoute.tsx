import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'

export default function ProtectedRoute({ role }: { role?: Role }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  // Wrong role: send them to their own home instead of showing an error
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/admin/lessons' : '/'} replace />
  }

  return <Outlet />
}