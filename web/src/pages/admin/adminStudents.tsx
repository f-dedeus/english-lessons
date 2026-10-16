import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudentList } from '../../hooks/useStudentList'
import {
  useCreateStudent,
  useRejectStudent,
  useResetStudentPassword,
  useUpdateStudent,
} from '../../hooks/useStudentMutations'
import StudentForm from '../../components/admin/studentForm'

type Mode = null | 'new' | number // number = id of the student being edited
type Credentials = { name: string; email: string; password: string; reason: 'created' | 'reset' }

const actionClass = 'text-sm font-medium text-indigo-600 hover:underline'

function CredentialsBox({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(credentials.password)
      setCopied(true)
    } catch {
      /* the password is visible anyway, the teacher can select and copy it */
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-5">
      <p className="font-medium text-green-900">
        {credentials.reason === 'created'
          ? `${credentials.name} was added.`
          : `New password for ${credentials.name}.`}
      </p>
      <p className="text-sm text-green-900">
        Share these details with the student. <strong>This password is shown only once</strong>, so copy it
        now. They can change it after logging in.
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-green-900">{credentials.email}</span>
        <code className="rounded bg-white px-3 py-1 font-mono text-slate-800">{credentials.password}</code>
        <button onClick={copy} className="font-medium text-green-900 underline">
          {copied ? 'Copied' : 'Copy password'}
        </button>
      </div>
      <button onClick={onClose} className="text-sm font-medium text-green-900 underline">
        Done, hide this
      </button>
    </div>
  )
}

export default function AdminStudents() {
  const students = useStudentList()
  const create = useCreateStudent()
  const update = useUpdateStudent()
  const reject = useRejectStudent()
  const reset = useResetStudentPassword()

  const [mode, setMode] = useState<Mode>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  function openForm(next: Mode) {
    create.reset()
    update.reset()
    setMode(next)
  }

  function handleReset(id: number, name: string, email: string) {
    if (!window.confirm(`Reset ${name}'s password? Their current password stops working.`)) return
    reset.mutate(id, {
      onSuccess: (data) =>
        setCredentials({ name, email, password: data.temporaryPassword, reason: 'reset' }),
    })
  }

  function handleReject(id: number, name: string) {
    if (window.confirm(`Reject ${name}'s sign-up? The account will be deleted.`)) reject.mutate(id)
  }

  const editing = typeof mode === 'number' ? students.data?.find((s) => s.id === mode) : undefined

  const pending = students.data?.filter((s) => s.status === 'pending') ?? []

  const query = search.trim().toLowerCase()
  const visible = students.data?.filter(
    (s) =>
      s.status !== 'pending' &&
      (showInactive || s.status === 'active') &&
      (s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Students</h1>
        <button
          onClick={() => openForm('new')}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add student
        </button>
      </div>

      {credentials && <CredentialsBox credentials={credentials} onClose={() => setCredentials(null)} />}

      {pending.length > 0 && (
        <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Waiting for approval ({pending.length})
          </h2>
          {pending.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-sm text-slate-500">{s.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: s.id, patch: { status: 'active' } })}
                >
                  Approve
                </button>
                <button
                  className="text-sm font-medium text-red-600 hover:underline"
                  disabled={reject.isPending}
                  onClick={() => handleReject(s.id, s.name)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {reject.isError && <p className="text-sm text-red-600">{reject.error.message}</p>}
        </section>
      )}

      {mode === 'new' && (
        <StudentForm
          key="new"
          title="New student"
          submitLabel="Add student"
          submitting={create.isPending}
          serverError={create.error?.message}
          onCancel={() => openForm(null)}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: (data) => {
                setMode(null)
                setCredentials({
                  name: data.student.name,
                  email: data.student.email,
                  password: data.temporaryPassword,
                  reason: 'created',
                })
              },
            })
          }
        />
      )}

      {editing && (
        <StudentForm
          key={editing.id}
          initial={editing}
          title={`Edit ${editing.name}`}
          submitLabel="Save changes"
          submitting={update.isPending}
          serverError={update.error?.message}
          onCancel={() => openForm(null)}
          onSubmit={(input) =>
            update.mutate({ id: editing.id, patch: input }, { onSuccess: () => setMode(null) })
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {students.isLoading && <p className="text-slate-500">Loading students...</p>}
      {students.isError && <p className="text-red-600">Could not load students.</p>}
      {reset.isError && <p className="text-red-600">{reset.error.message}</p>}
      {visible?.length === 0 && <p className="text-slate-500">No students found.</p>}

      <div className="space-y-3">
        {visible?.map((s) => (
          <div
            key={s.id}
            className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 ${
              s.status === 'active' ? '' : 'opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-800">{s.name}</p>
                {s.status === 'inactive' && (
                  <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-700">
                    inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{s.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/admin/students/${s.id}`} className={actionClass}>
                Lessons
              </Link>
              <button className={actionClass} onClick={() => openForm(s.id)}>
                Edit
              </button>
              <button
                className={actionClass}
                disabled={reset.isPending}
                onClick={() => handleReset(s.id, s.name, s.email)}
              >
                Reset password
              </button>
              <button
                className={actionClass}
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    id: s.id,
                    patch: { status: s.status === 'active' ? 'inactive' : 'active' },
                  })
                }
              >
                {s.status === 'active' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}