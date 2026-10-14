import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLessonById } from '../../hooks/useLessonById'
import { useUpdateLesson } from '../../hooks/useLessonMutations'
import LessonForm from '../../components/admin/lessonForm'

export default function AdminLessonEdit() {
  const { id } = useParams()
  const lessonId = Number(id)
  const navigate = useNavigate()

  const lesson = useLessonById(lessonId)
  const update = useUpdateLesson()

  if (lesson.isLoading) return <p className="text-slate-500">Loading lesson...</p>
  if (lesson.isError || !lesson.data) return <p className="text-red-600">Lesson not found.</p>

  return (
    <div className="space-y-6">
      <Link to="/admin/lessons" className="text-sm text-indigo-600 hover:underline">← Back to library</Link>
      <h1 className="text-2xl font-bold text-slate-800">Edit lesson</h1>
      <LessonForm
        initial={lesson.data}
        submitLabel="Save changes"
        submitting={update.isPending}
        onSubmit={(input) =>
          update.mutate({ id: lessonId, patch: input }, { onSuccess: () => navigate('/admin/lessons') })
        }
      />
      {update.isError && <p className="text-red-600">Could not save the lesson.</p>}
    </div>
  )
}