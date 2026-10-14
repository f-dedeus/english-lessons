import { Link, useParams } from 'react-router-dom'
import { useLessonById } from '../hooks/useLessonById'
import { useMyHomeworkList } from '../hooks/useMyHomeworkList'
import MaterialView from '../components/materials/materialView'
import AssignmentCard from '../components/assignmentCard'

export default function LessonPage() {
  const { id } = useParams()
  const lessonId = Number(id)

  const lesson = useLessonById(lessonId)
  const assignments = useMyHomeworkList()

  const lessonAssignments = assignments.data?.filter((a) => a.lessonId === lessonId)

  if (lesson.isLoading) return <p className="text-slate-500">Loading lesson...</p>

  if (lesson.isError || !lesson.data) {
    return (
      <div className="space-y-3">
        <p className="text-red-600">Lesson not found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">← Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">← Back to dashboard</Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{lesson.data.title}</h1>
        <p className="mt-1 text-slate-500">{lesson.data.description}</p>
      </div>

      <section className="space-y-6">
        {lesson.data.materials.length === 0 && (
          <p className="text-slate-500">This lesson has no materials yet.</p>
        )}
        {lesson.data.materials.map((m) => (
          <MaterialView key={m.id} material={m} />
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Homework for this lesson</h2>
        {lessonAssignments?.length === 0 && (
          <p className="text-slate-500">No homework for this lesson.</p>
        )}
        <div className="space-y-3">
          {lessonAssignments?.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      </section>
    </div>
  )
}