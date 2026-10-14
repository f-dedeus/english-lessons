import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStudentList } from '../../hooks/useStudentList'
import { useAdminLessonList } from '../../hooks/useAdminLessonList'
import { useLessonAssignmentList } from '../../hooks/useLessonAssignmentList'
import { useAssignLesson, useUnassignLesson } from '../../hooks/useLessonAssignmentMutations'
import StudentNotes from '../../components/admin/studentNotes'

export default function AdminStudentDetail() {
  const { id } = useParams()
  const studentId = Number(id)

  const students = useStudentList()
  const lessons = useAdminLessonList()
  const assignments = useLessonAssignmentList()
  const assign = useAssignLesson()
  const unassign = useUnassignLesson()

  const [selected, setSelected] = useState('')

  if (students.isLoading || lessons.isLoading || assignments.isLoading) {
    return <p className="text-slate-500">Loading...</p>
  }

  const student = students.data?.find((s) => s.id === studentId)
  if (!student) return <p className="text-red-600">Student not found.</p>

  const mine = (assignments.data ?? []).filter((a) => a.studentId === studentId)
  const assignedLessonIds = new Set(mine.map((a) => a.lessonId))

  const rows = mine.flatMap((a) => {
    const lesson = lessons.data?.find((l) => l.id === a.lessonId)
    return lesson ? [{ assignment: a, lesson }] : []
  })

  const available = (lessons.data ?? []).filter(
    (l) => l.status === 'published' && !assignedLessonIds.has(l.id),
  )

  return (
    <div className="space-y-8">
      <Link to="/admin/students" className="text-sm text-indigo-600 hover:underline">← Back to students</Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{student.name}</h1>
        <p className="text-slate-500">{student.email}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Assigned lessons</h2>

        {rows.length === 0 && <p className="text-slate-500">No lessons assigned yet.</p>}

        <div className="space-y-3">
          {rows.map(({ assignment, lesson }) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-800">{lesson.title}</p>
                <p className="text-sm text-slate-500">
                  Assigned on {assignment.assignedAt}
                  {lesson.status === 'draft' && ' · currently a draft (hidden from the student)'}
                </p>
              </div>
              <button
                className="text-sm font-medium text-red-600 hover:underline"
                disabled={unassign.isPending}
                onClick={() => unassign.mutate(assignment.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Choose a published lesson...</option>
            {available.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <button
            disabled={!selected || assign.isPending}
            onClick={() =>
              assign.mutate(
                { lessonId: Number(selected), studentId },
                { onSuccess: () => setSelected('') },
              )
            }
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Assign lesson
          </button>
        </div>
      </section>
      <StudentNotes studentId={studentId} />
    </div>
  )
}