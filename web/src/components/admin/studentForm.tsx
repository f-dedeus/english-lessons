import { useState, type FormEvent } from 'react'
import type { StudentInput } from '../../types'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  initial?: StudentInput
  title: string
  submitLabel: string
  submitting: boolean
  serverError?: string
  onSubmit: (input: StudentInput) => void
  onCancel: () => void
}

export default function StudentForm({
  initial,
  title,
  submitLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('The student needs a name.')
    if (!emailPattern.test(email.trim())) return setError('Enter a valid email address.')
    setError(null)
    onSubmit({ name: name.trim(), email: email.trim() })
  }

  const message = error ?? serverError

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-indigo-200 bg-white p-5"
    >
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}