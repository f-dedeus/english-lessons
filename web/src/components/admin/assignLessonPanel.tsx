import { useState } from 'react'
import type { Student } from '../../types'
import { useStudentList } from '../../hooks/useStudentList'
import { useLessonAssignmentList } from '../../hooks/useLessonAssignmentList'
import { useSetLessonStudents } from '../../hooks/useLessonAssignmentMutations'

type Props = { lessonId: number; lessonTitle: string; onClose: () => void }

export default function AssignLessonPanel({ lessonId, lessonTitle, onClose }: Props) {
  const students = useStudentList()
  const assignments = useLessonAssignmentList()

  if (students.isLoading || assignments.isLoading) {
    return <p className="text-sm text-slate-500">Loading students...</p>
  }
  if (!students.data || !assignments.data) {
    return <p className="text-sm text-red-600">Could not load students.</p>
  }

  const assignedIds = assignments.data.filter((a) => a.lessonId === lessonId).map((a) => a.studentId)

  return (
    <PanelBody
      lessonId={lessonId}
      lessonTitle={lessonTitle}
      students={students.data}
      assignedIds={assignedIds}
      onClose={onClose}
    />
  )
}

type BodyProps = Props & { students: Student[]; assignedIds: number[] }

function PanelBody({ lessonId, lessonTitle, students, assignedIds, onClose }: BodyProps) {
  const activeStudents = students.filter((s) => s.active)
  const activeIds = new Set(activeStudents.map((s) => s.id))

  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(assignedIds.filter((id) => activeIds.has(id))),
  )
  const save = useSetLessonStudents()

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    // Inactive students aren't shown, so keep their existing assignments untouched
    const keepInactive = assignedIds.filter((id) => !activeIds.has(id))
    save.mutate(
      { lessonId, studentIds: [...checked, ...keepInactive] },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <p className="text-sm font-medium text-slate-700">Assign "{lessonTitle}" to:</p>

      {activeStudents.length === 0 && (
        <p className="text-sm text-slate-500">No active students yet.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {activeStudents.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <input type="checkbox" checked={checked.has(s.id)} onChange={() => toggle(s.id)} />
            <span className="font-medium text-slate-800">{s.name}</span>
            <span className="text-slate-500">{s.email}</span>
          </label>
        ))}
      </div>

      {save.isError && <p className="text-sm text-red-600">Could not save the assignments.</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {save.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}