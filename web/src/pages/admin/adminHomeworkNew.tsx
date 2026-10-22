import { Link, useNavigate } from 'react-router-dom'
import { useAdminLessonList } from '../../hooks/useAdminLessonList'
import { useCreateHomework } from '../../hooks/useHomeworkMutations'
import HomeworkForm from '../../components/admin/homeworkForm'

export default function AdminHomeworkNew() {
  const navigate = useNavigate()
  const lessons = useAdminLessonList()
  const create = useCreateHomework()

  return (
    <div className="space-y-6">
      <Link to="/admin/homework" className="text-sm text-indigo-600 hover:underline">← Back to homework</Link>
      <h1 className="text-2xl font-bold text-slate-800">New homework</h1>

      {lessons.isLoading && <p className="text-slate-500">Loading lessons...</p>}
      {lessons.data && (
        <HomeworkForm
          lessons={lessons.data}
          submitLabel="Create homework"
          submitting={create.isPending}
          onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate('/admin/homework') })}
        />
      )}
      {create.isError && <p className="text-red-600">{create.error.message}</p>}
    </div>
  )
}