import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHomeworkList } from '../../hooks/useHomeworkList'
import { useHomeworkAssignmentList } from '../../hooks/useHomeworkAssignmentList'
import { useAdminLessonList } from '../../hooks/useAdminLessonList'
import { useDeleteHomework, useDuplicateHomework } from '../../hooks/useHomeworkMutations'
import AssignHomeworkPanel from '../../components/admin/assignHomeworkPanel'

const actionClass = 'text-sm font-medium text-indigo-600 hover:underline'

export default function AdminHomework() {
  const homework = useHomeworkList()
  const assignments = useHomeworkAssignmentList()
  const lessons = useAdminLessonList()
  const remove = useDeleteHomework()
  const duplicate = useDuplicateHomework()

  const [assigningId, setAssigningId] = useState<number | null>(null)

  const studentCount = (homeworkId: number) =>
    assignments.data?.filter((a) => a.homeworkId === homeworkId).length ?? 0

  function handleDelete(id: number, title: string, locked: boolean) {
    const count = studentCount(id)
    const extra =
      count > 0
        ? ` It will also be removed from ${count} student${count === 1 ? '' : 's'}${locked ? ', and their answers and grades will be deleted' : ''}.`
        : ''
    if (window.confirm(`Delete "${title}"?${extra}`)) remove.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Homework</h1>
        <Link
          to="/admin/homework/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New homework
        </Link>
      </div>

      {(remove.isError || duplicate.isError) && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {(remove.error ?? duplicate.error)?.message}
        </p>
      )}

      {homework.isLoading && <p className="text-slate-500">Loading homework...</p>}
      {homework.isError && <p className="text-red-600">Could not load homework.</p>}
      {homework.data?.length === 0 && <p className="text-slate-500">No homework yet. Create your first one.</p>}

      <div className="space-y-3">
        {homework.data?.map((h) => {
          const lesson = lessons.data?.find((l) => l.id === h.lessonId)
          const count = studentCount(h.id)
          return (
            <div key={h.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-800 [overflow-wrap:anywhere]">{h.title}</p>
                    {h.locked && (
                      <span
                        className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800"
                        title="Students have answered, so the questions can't be changed. Duplicate it to make a new version."
                      >
                        has answers
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Lesson: {lesson?.title ?? 'unknown'} · {h.questions.length} question
                    {h.questions.length === 1 ? '' : 's'} · {count} student{count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    className={actionClass}
                    onClick={() => setAssigningId(assigningId === h.id ? null : h.id)}
                  >
                    Assign
                  </button>
                  <Link to={`/admin/homework/${h.id}/edit`} className={actionClass}>Edit</Link>
                  <button
                    className={actionClass}
                    disabled={duplicate.isPending}
                    onClick={() => duplicate.mutate(h.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    className="text-sm font-medium text-red-600 hover:underline"
                    onClick={() => handleDelete(h.id, h.title, h.locked)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {assigningId === h.id && (
                <AssignHomeworkPanel
                  homeworkId={h.id}
                  homeworkTitle={h.title}
                  onClose={() => setAssigningId(null)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}