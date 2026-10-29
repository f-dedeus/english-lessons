import { Link } from 'react-router-dom'
import { useLessonList } from '../hooks/useLessonList'
import { useMyHomeworkList } from '../hooks/useMyHomeworkList'
import AssignmentCard from '../components/assignmentCard'
import { useNoteList } from '../hooks/useNoteList'
import { useDismissNote } from '../hooks/useNoteMutations'
import StickyNote from '../components/stickyNote'
import { useMyLevel } from '../hooks/usePlacement'
import { describeLevel } from '../utils/placement'


export default function StudentDashboard() {
  const lessons = useLessonList()
  const assignments = useMyHomeworkList()
  const notes = useNoteList()
  const dismissNote = useDismissNote()
  const level = useMyLevel()
  const levelInfo = describeLevel(level.data?.finalLevel)

  return (
    <div className="space-y-10">
      {levelInfo && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-4 text-indigo-900">
          <p className="text-sm text-indigo-700">Your level</p>
          <p className="text-xl font-bold">{levelInfo.label}</p>
          {levelInfo.description && <p className="text-sm">{levelInfo.description}</p>}
        </div>
      )}
      {notes.data && notes.data.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.data.map((n, i) => (
            <StickyNote
              key={n.id}
              note={n}
              index={i}
              onDismiss={() => dismissNote.mutate(n.id)}
            />
          ))}
        </section>
      )}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Your lessons</h2>
        {lessons.isLoading && <p className="text-slate-500">Loading lessons...</p>}
        {lessons.isError && <p className="text-red-600">Could not load lessons.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {lessons.data?.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lessons/${lesson.id}`}
              className="rounded-lg bg-white p-5 shadow-sm border border-slate-200 hover:border-indigo-400 transition"
            >
              <h3 className="font-semibold text-slate-800">{lesson.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{lesson.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Homework</h2>
        {assignments.isLoading && <p className="text-slate-500">Loading homework...</p>}
        {assignments.isError && <p className="text-red-600">Could not load homework.</p>}
        <div className="space-y-3">
          {assignments.data?.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      </section>
    </div>
  )
}