import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import PasswordInput from '../components/passwordInput'
import { useAuth } from '../hooks/useAuth'
import { useChangePassword } from '../hooks/useChangePassword'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

export default function SetPassword() {
  const { user, isLoading, refreshUser, logout } = useAuth()
  const change = useChangePassword()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="p-8 text-slate-500">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  // Nothing to change (or just changed): go home
  if (!user.mustChangePassword) {
    return <Navigate to={user.role === 'teacher' ? '/admin/lessons' : '/'} replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (next.length < 8) return setError('The new password needs at least 8 characters.')
    if (next !== confirm) return setError('The new passwords do not match.')
    if (next === current) return setError('The new password must be different from the temporary one.')

    setError(null)
    change.mutate(
      { currentPassword: current, newPassword: next },
      { onSuccess: () => refreshUser() },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">Choose a new password</h1>
          <p className="text-sm text-slate-500">
            You are using a temporary password. Pick one that only you know.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Temporary password</label>
          <PasswordInput
            autoComplete="current-password"
            className={inputClass}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <PasswordInput
            autoComplete="new-password"
            className={inputClass}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
          <PasswordInput
            autoComplete="new-password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {change.isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{change.error.message}</p>
        )}

        <button
          type="submit"
          disabled={change.isPending || !current || !next || !confirm}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {change.isPending ? 'Saving...' : 'Save new password'}
        </button>

        <button type="button" onClick={logout} className="w-full text-sm text-slate-500 hover:underline">
          Log out
        </button>
      </form>
    </div>
  )
}