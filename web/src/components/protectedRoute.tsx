import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'

export default function ProtectedRoute({ role }: { role?: Role }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p className="p-8 text-slate-500">Loading...</p>

  if (!user) return <Navigate to="/login" replace />

  // Still on a temporary password: choose a new one first
  if (user.mustChangePassword) return <Navigate to="/set-password" replace />

  // New students take the placement test first, and wait there until the teacher approves them
  if (user.role === 'student' && (user.status === 'pending' || user.placementRequired)) {
    return <Navigate to="/placement-test" replace />
  }

  // Wrong role: send them to their own home instead of showing an error
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/admin/lessons' : '/'} replace />
  }

  return <Outlet />
}