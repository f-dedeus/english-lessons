import { useState } from 'react'
import { useStudentList } from '../../hooks/useStudentList'
import { useHomeworkAssignmentList } from '../../hooks/useHomeworkAssignmentList'
import { useAssignHomework, useUnassignHomework } from '../../hooks/useHomeworkMutations'

type Props = { homeworkId: number; homeworkTitle: string; onClose: () => void }

const today = () => new Date().toISOString().slice(0, 10)
const inOneWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export default function AssignHomeworkPanel({ homeworkId, homeworkTitle, onClose }: Props) {
  const students = useStudentList()
  const assignments = useHomeworkAssignmentList()
  const assign = useAssignHomework()
  const unassign = useUnassignHomework()

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [dueDate, setDueDate] = useState(inOneWeek)
  const [error, setError] = useState<string | null>(null)

  if (students.isLoading || assignments.isLoading) {
    return <p className="mt-4 text-sm text-slate-500">Loading...</p>
  }
  if (!students.data || !assignments.data) {
    return <p className="mt-4 text-sm text-red-600">Could not load students.</p>
  }

  const mine = assignments.data.filter((a) => a.homeworkId === homeworkId)
  const assignmentByStudent = new Map(mine.map((a) => [a.studentId, a]))
  const visibleStudents = students.data.filter((s) => s.status === 'active' || assignmentByStudent.has(s.id))

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAssign() {
    if (selected.size === 0) return setError('Choose at least one student.')
    if (!dueDate) return setError('Choose a due date.')
    setError(null)
    assign.mutate(
      { homeworkId, studentIds: [...selected], dueDate },
      { onSuccess: () => setSelected(new Set()) },
    )
  }

  function handleRemove(assignmentId: number, studentName: string, status: string) {
    const warning =
      status === 'pending'
        ? `Remove "${homeworkTitle}" from ${studentName}?`
        : `${studentName} already submitted this homework. Removing it deletes their answer and grade. Continue?`
    if (window.confirm(warning)) unassign.mutate(assignmentId)
  }

  return (
    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
      <p className="text-sm font-medium text-slate-700">Assign "{homeworkTitle}" to:</p>

      {visibleStudents.length === 0 && <p className="text-sm text-slate-500">No students yet.</p>}

      <div className="space-y-2">
        {visibleStudents.map((s) => {
          const existing = assignmentByStudent.get(s.id)
          if (existing) {
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-slate-500">
                    {' '}· due {existing.dueDate} · {existing.status}
                  </span>
                </span>
                <button
                  className="font-medium text-red-600 hover:underline"
                  onClick={() => handleRemove(existing.id, s.name, existing.status)}
                >
                  Remove
                </button>
              </div>
            )
          }
          return (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <span className="font-medium text-slate-800">{s.name}</span>
              <span className="text-slate-500">{s.email}</span>
            </label>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
          <input
            type="date"
            min={today()}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAssign}
          disabled={assign.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {assign.isPending ? 'Assigning...' : 'Assign to selected'}
        </button>
        <button
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {assign.isError && <p className="text-sm text-red-600">Could not assign the homework.</p>}
    </div>
  )
}