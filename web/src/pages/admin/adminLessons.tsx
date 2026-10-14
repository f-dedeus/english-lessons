import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminLessonList } from '../../hooks/useAdminLessonList'
import { useLessonAssignmentList } from '../../hooks/useLessonAssignmentList'
import { useUpdateLesson, useDeleteLesson, useDuplicateLesson } from '../../hooks/useLessonMutations'
import AssignLessonPanel from '../../components/admin/assignLessonPanel'

const statusStyles = {
  draft: 'bg-slate-200 text-slate-700',
  published: 'bg-green-100 text-green-800',
}

const actionClass = 'text-sm font-medium text-indigo-600 hover:underline'

export default function AdminLessons() {
  const lessons = useAdminLessonList()
  const assignments = useLessonAssignmentList()
  const update = useUpdateLesson()
  const duplicate = useDuplicateLesson()
  const remove = useDeleteLesson()

  const [assigningId, setAssigningId] = useState<number | null>(null)

  function handleDelete(id: number, title: string) {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) remove.mutate(id)
  }

  function studentCount(lessonId: number) {
    return assignments.data?.filter((a) => a.lessonId === lessonId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Lesson library</h1>
        <Link
          to="/admin/lessons/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New lesson
        </Link>
      </div>

      {lessons.isLoading && <p className="text-slate-500">Loading lessons...</p>}
      {lessons.isError && <p className="text-red-600">Could not load lessons.</p>}
      {lessons.data?.length === 0 && <p className="text-slate-500">No lessons yet. Create your first one.</p>}

      <div className="space-y-3">
        {lessons.data?.map((lesson) => {
          const count = studentCount(lesson.id)
          return (
            <div key={lesson.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-800">{lesson.title}</p>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${statusStyles[lesson.status]}`}>
                      {lesson.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {lesson.materials.length} material{lesson.materials.length === 1 ? '' : 's'} ·{' '}
                    {count} student{count === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    className={`${actionClass} disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline`}
                    disabled={lesson.status === 'draft'}
                    title={lesson.status === 'draft' ? 'Publish the lesson first' : undefined}
                    onClick={() => setAssigningId(assigningId === lesson.id ? null : lesson.id)}
                  >
                    Assign
                  </button>
                  <Link to={`/admin/lessons/${lesson.id}/edit`} className={actionClass}>Edit</Link>
                  <button
                    className={actionClass}
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({
                        id: lesson.id,
                        patch: { status: lesson.status === 'draft' ? 'published' : 'draft' },
                      })
                    }
                  >
                    {lesson.status === 'draft' ? 'Publish' : 'Unpublish'}
                  </button>
                  <button className={actionClass} onClick={() => duplicate.mutate(lesson.id)}>Duplicate</button>
                  <button
                    className="text-sm font-medium text-red-600 hover:underline"
                    onClick={() => handleDelete(lesson.id, lesson.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {assigningId === lesson.id && (
                <AssignLessonPanel
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
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