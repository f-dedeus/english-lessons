import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { Answer, PlacementQuestion, PlacementState, StudentStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useCountdown } from '../hooks/useCountdown'
import { usePlacement, useStartPlacement, useSubmitPlacement } from '../hooks/usePlacement'
import { describeLevel } from '../utils/placement'
import { formatTime } from '../utils/time'
import Logo from '../components/logo'

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  )
}

const cardClass = 'space-y-4 rounded-lg border border-slate-200 bg-white p-6'
const primaryButton =
  'rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50'

// What the student answered so far (question id -> chosen option) in the shape the API expects.
// Blank questions are simply left out.
function toAnswers(choices: Record<number, number>): Record<number, Answer> {
  const answers: Record<number, Answer> = {}
  for (const [id, selected] of Object.entries(choices)) {
    answers[Number(id)] = { type: 'multiple_choice', selected: [selected] }
  }
  return answers
}

// Asks the server again who the user is. If the teacher approved the account,
// the page changes by itself; otherwise it says so.
function CheckApproval() {
  const { refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function check() {
    setChecking(true)
    setMessage(null)
    try {
      const me = await refreshUser()
      if (me.status === 'pending') setMessage('Not approved yet. Please check again later.')
    } catch {
      setMessage('Could not check right now. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={check}
        disabled={checking}
        className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
      >
        {checking ? 'Checking...' : 'Check if my account was approved'}
      </button>
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  )
}

function IntroCard({ data }: { data: PlacementState }) {
  const start = useStartPlacement()

  return (
    <section className={cardClass}>
      <h1 className="text-2xl font-bold text-slate-800">Let's find your English level</h1>
      <p className="text-slate-600">
        This short test helps your teacher find the right place to start. It is not a school exam: there
        is no grade and no failing.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        <li>
          {data.questionCount} multiple-choice questions in 3 parts. Each part is harder than the one
          before.
        </li>
        <li>
          {data.timeLimitMinutes
            ? `You have ${data.timeLimitMinutes} minutes. The timer starts when you click Start and cannot be paused.`
            : 'There is no time limit.'}
        </li>
        <li>
          <strong>If you don't know an answer, leave it blank. Please don't guess.</strong> It makes the
          result more accurate.
        </li>
        <li>Please don't use a dictionary or a translator.</li>
        <li>You can stop whenever you want, for example if the questions become too difficult.</li>
      </ul>
      {start.isError && <p className="text-sm text-red-600">{start.error.message}</p>}
      <button onClick={() => start.mutate()} disabled={start.isPending} className={primaryButton}>
        {start.isPending ? 'Starting...' : 'Start the test'}
      </button>
    </section>
  )
}

function QuestionCard({
  number,
  question,
  selected,
  disabled,
  onSelect,
  onClear,
}: {
  number: number
  question: PlacementQuestion
  selected: number | undefined
  disabled: boolean
  onSelect: (option: number) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-medium text-slate-800 wrap-anywhere">
        {number}. {question.prompt}
      </p>
      <div className="space-y-2">
        {question.options.map((option, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <input
              type="radio"
              name={`placement-${question.id}`}
              checked={selected === i}
              disabled={disabled}
              onChange={() => onSelect(i)}
            />
            {option}
          </label>
        ))}
      </div>
      {selected !== undefined && !disabled && (
        <button type="button" onClick={onClear} className="text-xs text-slate-500 hover:underline">
          Clear my answer
        </button>
      )}
    </div>
  )
}

function TestRunner({ data, onSubmitted }: { data: PlacementState; onSubmitted: () => void }) {
  const submit = useSubmitPlacement()
  const [choices, setChoices] = useState<Record<number, number>>({})
  const [confirming, setConfirming] = useState(false)

  const remaining = useCountdown(data.endsAt, data.serverNow)
  const timeIsUp = remaining !== null && remaining <= 0

  const answered = Object.keys(choices).length
  const blank = data.questions.length - answered

  // The latest answers, for the automatic send (the timer must not use stale ones)
  const choicesRef = useRef(choices)
  useEffect(() => {
    choicesRef.current = choices
  }, [choices])

  // When the time runs out, send whatever has been answered
  const autoSent = useRef(false)
  useEffect(() => {
    if (timeIsUp && !autoSent.current) {
      autoSent.current = true
      submit.mutate(toAnswers(choicesRef.current), { onSuccess: onSubmitted })
    }
  }, [timeIsUp, submit, onSubmitted])

  function send() {
    submit.mutate(toAnswers(choices), { onSuccess: onSubmitted })
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800">
        <span className={remaining !== null && remaining <= 60 ? 'text-red-700' : ''}>
          {timeIsUp
            ? 'Time is up. Sending your answers...'
            : remaining !== null
              ? `⏱ ${formatTime(remaining)} left`
              : 'No time limit'}
        </span>
        <span className="font-normal">
          {answered} of {data.questions.length} answered
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={timeIsUp || submit.isPending}
          className="rounded-md bg-white px-3 py-1 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          Finish test
        </button>
      </div>

      {confirming && !timeIsUp && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-900">Finish the test now?</p>
          <p className="text-sm text-amber-900">
            {blank > 0
              ? `You answered ${answered} of ${data.questions.length} questions. The ${blank} blank question${blank === 1 ? '' : 's'} ${blank === 1 ? 'is' : 'are'} okay: it is better to leave a question blank than to guess.`
              : 'You answered all the questions.'}
          </p>
          <div className="flex gap-3">
            <button onClick={send} disabled={submit.isPending} className={primaryButton}>
              {submit.isPending ? 'Sending...' : 'Yes, send my answers'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Keep going
            </button>
          </div>
        </div>
      )}

      {submit.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submit.error.message}</p>
      )}

      {data.questions.map((q, index) => {
        const previous = data.questions[index - 1]
        const newPart = q.part !== previous?.part
        const showPassage = q.passage !== undefined && q.passage !== previous?.passage

        return (
          <Fragment key={q.id}>
            {newPart && <h2 className="pt-4 text-xl font-bold text-slate-800">Part {q.part}</h2>}
            {showPassage && (
              <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-sm font-medium text-indigo-800">Read the text and answer the questions.</p>
                <p className="whitespace-pre-wrap text-slate-700 wrap-anywhere">{q.passage}</p>
              </div>
            )}
            <QuestionCard
              number={index + 1}
              question={q}
              selected={choices[q.id]}
              disabled={timeIsUp}
              onSelect={(option) => setChoices((prev) => ({ ...prev, [q.id]: option }))}
              onClear={() =>
                setChoices((prev) => {
                  const next = { ...prev }
                  delete next[q.id]
                  return next
                })
              }
            />
          </Fragment>
        )
      })}

      <button
        type="button"
        onClick={() => {
          setConfirming(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        disabled={timeIsUp || submit.isPending}
        className={primaryButton}
      >
        Finish test
      </button>
    </div>
  )
}

function ResultCard({ data, status }: { data: PlacementState; status: StudentStatus }) {
  const level = describeLevel(data.writtenLevel, data.possiblyAboveB1)

  return (
    <section className="space-y-5">
      <div className={cardClass}>
        <h1 className="text-2xl font-bold text-slate-800">You finished the test!</h1>

        {level && (
          <div className="space-y-1 rounded-lg border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-700">Your level in the written test</p>
            <p className="text-3xl font-bold text-indigo-900">{level.label}</p>
            {level.description && <p className="text-indigo-900">{level.description}</p>}
          </div>
        )}

        <p className="text-sm text-slate-500">
          Your teacher will confirm your final level after the conversation test.
        </p>
      </div>

      {data.schedulingMessage && (
        <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-900">Next step: the conversation test</p>
          <p className="whitespace-pre-wrap text-green-900 wrap-anywhere">{data.schedulingMessage}</p>
        </div>
      )}

      {status === 'pending' ? (
        <div className={cardClass}>
          <p className="text-slate-700">
            Your account is waiting for your teacher's approval. You will be able to use the site as soon as
            it is approved.
          </p>
          <CheckApproval />
        </div>
      ) : (
        <Link to="/" className={`inline-block ${primaryButton}`}>
          Go to my dashboard
        </Link>
      )}
    </section>
  )
}

export default function PlacementTest() {
  const { user, isLoading, refreshUser } = useAuth()
  const usable = !!user && user.role === 'student' && !user.mustChangePassword
  const placement = usePlacement(usable)

  if (isLoading) return <p className="p-8 text-slate-500">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword) return <Navigate to="/set-password" replace />
  if (user.role !== 'student') return <Navigate to="/admin/lessons" replace />

  const data = placement.data
  let content: ReactNode

  if (placement.isLoading) {
    content = <p className="text-slate-500">Loading...</p>
  } else if (placement.isError || !data) {
    content = (
      <div className={cardClass}>
        <p className="text-red-600">Could not load the test.</p>
        <button onClick={() => placement.refetch()} className="text-sm font-medium text-indigo-600 hover:underline">
          Try again
        </button>
      </div>
    )
  } else if (data.state === 'not_available') {
    content =
      user.status === 'pending' ? (
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-slate-800">Waiting for approval</h1>
          <p className="text-slate-700">
            Your account is waiting for your teacher's approval. You will be able to use the site as soon as
            it is approved.
          </p>
          <CheckApproval />
        </div>
      ) : (
        <Navigate to="/" replace />
      )
  } else if (data.state === 'not_started') {
    content = <IntroCard data={data} />
  } else if (data.state === 'running') {
    content = <TestRunner data={data} onSubmitted={() => void refreshUser()} />
  } else if (data.state === 'expired') {
    content = (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Time is up</h1>
        <p className="text-red-900">
          The time for the test ran out before your answers were sent. Please tell your teacher, who can give
          you another attempt.
        </p>
      </div>
    )
  } else {
    content = <ResultCard data={data} status={user.status} />
  }

  return <Shell>{content}</Shell>
}