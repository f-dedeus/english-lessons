import { Link, useNavigate } from 'react-router-dom'
import { useCreateLesson } from '../../hooks/useLessonMutations'
import LessonForm from '../../components/admin/lessonForm'

export default function AdminLessonNew() {
  const navigate = useNavigate()
  const create = useCreateLesson()

  return (
    <div className="space-y-6">
      <Link to="/admin/lessons" className="text-sm text-indigo-600 hover:underline">← Back to library</Link>
      <h1 className="text-2xl font-bold text-slate-800">New lesson</h1>
      <LessonForm
        submitLabel="Create lesson"
        submitting={create.isPending}
        onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate('/admin/lessons') })}
      />
      {create.isError && <p className="text-red-600">{create.error.message}</p>} {/* ← changed */}
    </div>
  )
}