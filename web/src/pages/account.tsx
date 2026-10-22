import { useState, type FormEvent } from 'react'
import PasswordInput from '../components/passwordInput'
import { useAuth } from '../hooks/useAuth'
import { useChangePassword } from '../hooks/useChangePassword'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

export default function Account() {
  const { user } = useAuth()
  const change = useChangePassword()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setDone(false)

    if (next.length < 8) return setError('The new password needs at least 8 characters.')
    if (next !== confirm) return setError('The new passwords do not match.')
    if (next === current) return setError('The new password must be different from the current one.')

    setError(null)
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setDone(true)
          setCurrent('')
          setNext('')
          setConfirm('')
        },
      },
    )
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My account</h1>
        <p className="text-slate-500">
          {user?.name} · {user?.email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-800">Change password</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
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
        {done && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Your password was changed.</p>
        )}

        <button
          type="submit"
          disabled={change.isPending || !current || !next || !confirm}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {change.isPending ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  )
}