import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await api.post<{ message: string }>('/auth/forgot-password', { email })
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-indigo-600">Forgot your password?</h1>

        {message ? (
          <>
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
            <Link to="/login" className="block text-center text-sm font-medium text-indigo-600 hover:underline">
              Back to log in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">
              Enter your email. Your teacher will be notified and will send you a new password.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                autoComplete="username"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Notify my teacher'}
            </button>
            <Link to="/login" className="block text-center text-sm text-slate-500 hover:underline">
              Back to log in
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}