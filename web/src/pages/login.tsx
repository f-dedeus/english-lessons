import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../components/authLayout'
import { authError, authInput, authLabel, authPrimaryButton } from '../components/authStyles'
import PasswordInput from '../components/passwordInput'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [slow, setSlow] = useState(false)

  // If the login takes more than 5 seconds, explain why (the server may be waking up)
  useEffect(() => {
    if (!submitting) return
    const id = setTimeout(() => setSlow(true), 5000)
    return () => {
      clearTimeout(id)
      setSlow(false)
    }
  }, [submitting])

  if (user) return <Navigate to={user.role === 'teacher' ? '/admin/lessons' : '/'} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Log in to your account and keep learning."
      cta={{ text: 'Not studying with us yet?', label: 'Create account', to: '/signup' }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={authLabel}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            autoComplete="username"
            className={authInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={authLabel}>
            Password <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            tone="dark"
            autoComplete="current-password"
            className={authInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className={authError}>{error}</p>}

        {slow && !error && (
          <p className="text-sm text-[#c2ae9a]">
            Waking up the server... the first login of the day can take up to a minute.
          </p>
        )}

        <button type="submit" disabled={submitting || !email || !password} className={`mt-2 ${authPrimaryButton}`}>
          {submitting ? (
            'Logging in...'
          ) : (
            <>
              Log in
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </>
          )}
        </button>

        <p className="text-center">
          <Link to="/forgot-password" className="text-sm text-[#c2ae9a] underline hover:text-[#fff6e8]">
            Forgot your password?
          </Link>
        </p>
      </form>

      {import.meta.env.DEV && (
        <p className="mt-8 text-center text-xs text-slate-500">
          Dev logins: teacher@example.com or ana@example.com, password: password123
        </p>
      )}
    </AuthLayout>
  )
}