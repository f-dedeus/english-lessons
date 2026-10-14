import { useState } from 'react'
import { useStudentList } from '../../hooks/useStudentList'
import { useCreateStudent, useUpdateStudent } from '../../hooks/useStudentMutations'
import StudentForm from '../../components/admin/studentForm'
import { Link } from 'react-router-dom'

type Mode = null | 'new' | number // number = id of the student being edited

const actionClass = 'text-sm font-medium text-indigo-600 hover:underline'

export default function AdminStudents() {
  const students = useStudentList()
  const create = useCreateStudent()
  const update = useUpdateStudent()

  const [mode, setMode] = useState<Mode>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  function openForm(next: Mode) {
    create.reset()
    update.reset()
    setMode(next)
  }

  const editing = typeof mode === 'number' ? students.data?.find((s) => s.id === mode) : undefined

  const query = search.trim().toLowerCase()
  const visible = students.data?.filter(
    (s) =>
      (showInactive || s.active) &&
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

      {mode === 'new' && (
        <StudentForm
          key="new"
          title="New student"
          submitLabel="Add student"
          submitting={create.isPending}
          serverError={create.error?.message}
          onCancel={() => openForm(null)}
          onSubmit={(input) => create.mutate(input, { onSuccess: () => setMode(null) })}
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
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {students.isLoading && <p className="text-slate-500">Loading students...</p>}
      {students.isError && <p className="text-red-600">Could not load students.</p>}
      {visible?.length === 0 && <p className="text-slate-500">No students found.</p>}

      <div className="space-y-3">
        {visible?.map((s) => (
          <div
            key={s.id}
            className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 ${
              s.active ? '' : 'opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-800">{s.name}</p>
                {!s.active && (
                  <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-700">
                    inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{s.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className={actionClass} onClick={() => openForm(s.id)}>
                Edit
              </button>
              <Link to={`/admin/students/${s.id}`} className={actionClass}>Lessons
              </Link>
              <button
                className={actionClass}
                disabled={update.isPending}
                onClick={() => update.mutate({ id: s.id, patch: { active: !s.active } })}
              >
                {s.active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}