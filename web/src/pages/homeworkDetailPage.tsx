import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Answer, HomeworkDetail } from '../types'
import { useMyHomeworkById } from '../hooks/useMyHomeworkById'
import { useSubmitHomework } from '../hooks/useSubmissionMutations'
import StatusBadge from '../components/statusBadge'
import QuestionInput from '../components/questions/questionInput'
import QuestionReview from '../components/questions/questionReview'
import { emptyAnswer, isAnswered } from '../utils/questions'
import { isOverdue } from '../utils/dates'

export default function HomeworkDetailPage() {
  const { id } = useParams()
  const homework = useMyHomeworkById(Number(id))

  if (homework.isLoading) return <p className="text-slate-500">Loading homework...</p>

  if (homework.isError || !homework.data) {
    return (
      <div className="space-y-3">
        <p className="text-red-600">Homework not found.</p>
        <Link to="/homework" className="text-indigo-600 hover:underline">← Back to homework</Link>
      </div>
    )
  }

  const detail = homework.data
  const overdue = isOverdue(detail.dueDate, detail.status)

  return (
    <div className="space-y-8">
      <Link to="/homework" className="text-sm text-indigo-600 hover:underline">← Back to homework</Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">{detail.title}</h1>
          <StatusBadge status={detail.status} />
        </div>
        <p className={`text-sm ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          Due: {detail.dueDate}
          {overdue && ' · overdue'}
        </p>
        <Link to={`/lessons/${detail.lessonId}`} className="text-sm text-indigo-600 hover:underline">
          Go to the lesson
        </Link>
      </div>

      {detail.instructions && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 font-semibold text-slate-800">Instructions</h2>
          <p className="whitespace-pre-wrap text-slate-700">{detail.instructions}</p>
        </section>
      )}

      <AnswerSection key={detail.id} detail={detail} />
    </div>
  )
}

function AnswerSection({ detail }: { detail: HomeworkDetail }) {
  const submit = useSubmitHomework()
  const [answers, setAnswers] = useState<Record<number, Answer>>(() =>
    Object.fromEntries(detail.questions.map((q) => [q.id, detail.answers?.[q.id] ?? emptyAnswer(q)])),
  )
  const [localError, setLocalError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (detail.status === 'graded') {
    return (
      <section className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="text-lg font-bold text-green-900">Grade: {detail.grade}/10</p>
          {detail.feedback && (
            <p className="mt-2 whitespace-pre-wrap text-green-900">
              <span className="font-medium">Teacher's feedback: </span>
              {detail.feedback}
            </p>
          )}
        </div>
        {detail.questions.map((q, i) => (
          <QuestionReview key={q.id} question={q} answer={detail.answers?.[q.id]} index={i} />
        ))}
      </section>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(false)

    const missing = detail.questions.findIndex((q) => !isAnswered(q, answers[q.id]))
    if (missing !== -1) return setLocalError(`Answer question ${missing + 1} before sending.`)

    setLocalError(null)
    submit.mutate({ assignmentId: detail.id, answers }, { onSuccess: () => setSent(true) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {detail.questions.map((q, i) => (
        <QuestionInput
          key={q.id}
          question={q}
          answer={answers[q.id] ?? emptyAnswer(q)}
          index={i}
          onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
        />
      ))}

      {detail.submittedAt && (
        <p className="text-sm text-slate-500">
          Last sent on {new Date(detail.submittedAt).toLocaleString()}. You can update your answers until
          your teacher grades them.
        </p>
      )}
      {localError && <p className="text-sm text-red-600">{localError}</p>}
      {submit.isError && <p className="text-sm text-red-600">{submit.error.message}</p>}
      {sent && <p className="text-sm text-green-700">Answers sent. Your teacher will grade them soon.</p>}

      <button
        type="submit"
        disabled={submit.isPending}
        className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submit.isPending ? 'Sending...' : detail.status === 'submitted' ? 'Update answers' : 'Submit answers'}
      </button>
    </form>
  )
}