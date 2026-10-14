import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminLessonList } from '../../hooks/useAdminLessonList'
import { useHomeworkList } from '../../hooks/useHomeworkList'
import { useUpdateHomework } from '../../hooks/useHomeworkMutations'
import HomeworkForm from '../../components/admin/homeworkForm'

export default function AdminHomeworkEdit() {
  const { id } = useParams()
  const homeworkId = Number(id)
  const navigate = useNavigate()

  const homework = useHomeworkList()
  const lessons = useAdminLessonList()
  const update = useUpdateHomework()

  if (homework.isLoading || lessons.isLoading) return <p className="text-slate-500">Loading...</p>

  const current = homework.data?.find((h) => h.id === homeworkId)
  if (!current || !lessons.data) return <p className="text-red-600">Homework not found.</p>

  return (
    <div className="space-y-6">
      <Link to="/admin/homework" className="text-sm text-indigo-600 hover:underline">← Back to homework</Link>
      <h1 className="text-2xl font-bold text-slate-800">Edit homework</h1>
      <HomeworkForm
        lessons={lessons.data}
        initial={current}
        submitLabel="Save changes"
        submitting={update.isPending}
        onSubmit={(input) =>
          update.mutate({ id: homeworkId, patch: input }, { onSuccess: () => navigate('/admin/homework') })
        }
      />
      {update.isError && <p className="text-red-600">Could not save the homework.</p>}
    </div>
  )
}