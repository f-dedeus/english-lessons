import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Answer, HomeworkDetail } from '../types'
import { useMyHomeworkById } from '../hooks/useMyHomeworkById'
import { useStartHomework, useSubmitHomework } from '../hooks/useSubmissionMutations'
import { useCountdown } from '../hooks/useCountdown'
import StatusBadge from '../components/statusBadge'
import QuestionInput from '../components/questions/questionInput'
import QuestionReview from '../components/questions/questionReview'
import { emptyAnswer, isAnswered } from '../utils/questions'
import { isOverdue } from '../utils/dates'

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`
}

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
  const timer = detail.timer
  const overdue = isOverdue(detail.dueDate, detail.status)

  return (
    <div className="space-y-8">
      <Link to="/homework" className="text-sm text-indigo-600 hover:underline">← Back to homework</Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 [overflow-wrap:anywhere]">{detail.title}</h1>
          <StatusBadge status={detail.status} />
        </div>
        <p className={`text-sm ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          Due: {detail.dueDate}
          {overdue && ' · overdue'}
          {timer && ` · ⏱ ${timer.limitMinutes} min`}
        </p>
        <Link to={`/lessons/${detail.lessonId}`} className="text-sm text-indigo-600 hover:underline">
          Go to the lesson
        </Link>
      </div>

      {timer?.state === 'not_started' && <StartCard assignmentId={detail.id} minutes={timer.limitMinutes} />}

      {timer?.state === 'expired' && (
        <section className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Time is up</h2>
          <p className="text-red-900">
            The time for this homework ran out before your answers were sent. Ask your teacher if you can
            have another attempt.
          </p>
        </section>
      )}

      {timer?.state !== 'not_started' && timer?.state !== 'expired' && (
        <>
          {detail.instructions && (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="mb-2 font-semibold text-slate-800">Instructions</h2>
              <p className="whitespace-pre-wrap text-slate-700 [overflow-wrap:anywhere]">{detail.instructions}</p>
            </section>
          )}
          <AnswerSection key={detail.id} detail={detail} />
        </>
      )}
    </div>
  )
}

function StartCard({ assignmentId, minutes }: { assignmentId: number; minutes: number }) {
  const start = useStartHomework()

  return (
    <section className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50 p-6">
      <h2 className="text-lg font-semibold text-indigo-900">Timed homework</h2>
      <p className="text-indigo-900">
        You will have <strong>{minutes} minutes</strong> to complete it. The timer starts as soon as you
        click Start and cannot be paused, even if you close this page. You get one attempt, and your answers
        are sent automatically when the time runs out.
      </p>
      {start.isError && <p className="text-sm text-red-700">{start.error.message}</p>}
      <button
        onClick={() => start.mutate(assignmentId)}
        disabled={start.isPending}
        className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {start.isPending ? 'Starting...' : 'Start now'}
      </button>
    </section>
  )
}

function AnswerSection({ detail }: { detail: HomeworkDetail }) {
  const submit = useSubmitHomework()
  const [answers, setAnswers] = useState<Record<number, Answer>>(() =>
    Object.fromEntries(detail.questions.map((q) => [q.id, detail.answers?.[q.id] ?? emptyAnswer(q)])),
  )
  const [localError, setLocalError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const timer = detail.timer
  const running = timer?.state === 'running' && detail.status === 'pending'
  const remaining = useCountdown(running ? timer?.endsAt : undefined, timer?.serverNow)
  const timeIsUp = running && remaining !== null && remaining <= 0

  // The latest answers, for the automatic send (the timer callback must not use stale ones)
  const answersRef = useRef(answers)
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // When the time runs out, send whatever has been answered
  const autoSent = useRef(false)
  useEffect(() => {
    if (timeIsUp && !autoSent.current) {
      autoSent.current = true
      submit.mutate({ assignmentId: detail.id, answers: answersRef.current })
    }
  }, [timeIsUp, detail.id, submit])

  if (detail.status === 'graded') {
    return (
      <section className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="text-lg font-bold text-green-900">Grade: {detail.grade}/10</p>
          {detail.feedback && (
            <p className="mt-2 whitespace-pre-wrap text-green-900 [overflow-wrap:anywhere]">
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

  // A timed homework allows a single attempt
  if (timer && detail.status === 'submitted') {
    return (
      <section className="rounded-lg border border-green-200 bg-green-50 p-6">
        <p className="font-medium text-green-900">Your answers were sent. Your teacher will grade them soon.</p>
      </section>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(false)

    if (!timeIsUp) {
      const missing = detail.questions.findIndex((q) => !isAnswered(q, answers[q.id]))
      if (missing !== -1) return setLocalError(`Answer question ${missing + 1} before sending.`)
    }

    setLocalError(null)
    submit.mutate({ assignmentId: detail.id, answers }, { onSuccess: () => setSent(true) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {running && remaining !== null && (
        <div
          className={`sticky top-0 z-10 rounded-md border px-4 py-2 text-center text-sm font-semibold ${
            remaining <= 60
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-indigo-200 bg-indigo-50 text-indigo-800'
          }`}
        >
          {timeIsUp ? 'Time is up. Sending your answers...' : `⏱ ${formatTime(remaining)} left`}
        </div>
      )}

      <fieldset disabled={timeIsUp} className="min-w-0 space-y-4 border-0 p-0">
        {detail.questions.map((q, i) => (
          <QuestionInput
            key={q.id}
            question={q}
            answer={answers[q.id] ?? emptyAnswer(q)}
            index={i}
            onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
          />
        ))}
      </fieldset>

      {detail.submittedAt && !timer && (
        <p className="text-sm text-slate-500">
          Last sent on {new Date(detail.submittedAt).toLocaleString()}. You can update your answers until
          your teacher grades them.
        </p>
      )}
      {localError && <p className="text-sm text-red-600">{localError}</p>}
      {submit.isError && <p className="text-sm text-red-600">{submit.error.message}</p>}
      {sent && !timer && <p className="text-sm text-green-700">Answers sent. Your teacher will grade them soon.</p>}

      <button
        type="submit"
        disabled={submit.isPending}
        className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submit.isPending
          ? 'Sending...'
          : timeIsUp
            ? 'Send answers'
            : detail.status === 'submitted'
              ? 'Update answers'
              : 'Submit answers'}
      </button>
    </form>
  )
}