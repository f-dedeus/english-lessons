import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import InterviewSheet from '../../components/admin/interviewSheet'
import {
  usePlacementDetail,
  useRequirePlacement,
  useRetakePlacement,
} from '../../hooks/usePlacementAdmin'
import type { PlacementDetail } from '../../types'

function WrittenResult({ detail }: { detail: PlacementDetail }) {
  const retake = useRetakePlacement()
  const ask = useRequirePlacement()
  const [showAnswers, setShowAnswers] = useState(false)
  const { attempt, student } = detail

  function handleRetake() {
    const warning = attempt?.submittedAt
      ? `This deletes ${student.name}'s answers and result and lets them take the test again. The interview sheet is kept. Continue?`
      : `Reset ${student.name}'s test so they can start again?`
    if (window.confirm(warning)) retake.mutate(student.id)
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-800">Written test</h2>

      {!attempt && (
        <div className="space-y-2">
          <p className="text-slate-600">
            {student.needsTest ? 'Asked to take the test, but has not started yet.' : 'Has not taken the test.'}
          </p>
          {!student.needsTest && (
            <button
              className="text-sm font-medium text-indigo-600 hover:underline"
              disabled={ask.isPending}
              onClick={() => ask.mutate({ studentId: student.id, required: true })}
            >
              Ask for the test
            </button>
          )}
        </div>
      )}

      {attempt && !attempt.submittedAt && (
        <div className="space-y-2">
          <p className={attempt.expired ? 'text-red-700' : 'text-slate-600'}>
            {attempt.expired
              ? 'The time ran out before the student sent their answers.'
              : 'The student started the test and has not finished it yet.'}
          </p>
          <button className="text-sm font-medium text-indigo-600 hover:underline" onClick={handleRetake}>
            Give another attempt
          </button>
        </div>
      )}

      {attempt?.submittedAt && (
        <>
          <div>
            <p className="text-sm text-slate-500">
              Sent on {new Date(attempt.submittedAt).toLocaleString()}
            </p>
            <p className="text-3xl font-bold text-slate-800">{attempt.writtenLevel}</p>
            {attempt.possiblyAboveB1 && (
              <p className="text-sm text-indigo-700">
                Passed the last block with 9 or 10 correct: possibly above B1.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {attempt.blocks?.map((b, i) => (
              <div key={b.level} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">
                  Part {i + 1} · {b.level}
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {b.correct}/{b.total}
                </p>
                <p className={b.passed ? 'text-green-700' : 'text-slate-500'}>{b.passed ? 'Passed' : 'Not passed'}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              className="text-sm font-medium text-indigo-600 hover:underline"
              onClick={() => setShowAnswers((v) => !v)}
            >
              {showAnswers ? 'Hide the answers' : 'Show the answers'}
            </button>
            <button className="text-sm font-medium text-indigo-600 hover:underline" onClick={handleRetake}>
              Give another attempt
            </button>
          </div>

          {showAnswers && (
            <div className="space-y-3">
              {detail.review.map((q) => (
                <div key={q.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-800 wrap-anywhere">
                    {q.number}. <span className="text-slate-400">({q.level})</span> {q.prompt}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((option, i) => {
                      const isRight = i === q.correct
                      const isChosen = i === q.chosen
                      return (
                        <li
                          key={i}
                          className={isRight ? 'text-green-700' : isChosen ? 'text-red-700' : 'text-slate-600'}
                        >
                          {isChosen ? '☑' : '☐'} {option}
                          {isRight && ' ✓'}
                        </li>
                      )
                    })}
                  </ul>
                  {q.chosen === undefined && <p className="mt-1 text-xs text-slate-500">Left blank</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(retake.isError || ask.isError) && (
        <p className="text-sm text-red-600">{(retake.error ?? ask.error)?.message}</p>
      )}
    </section>
  )
}

export default function AdminPlacementStudent() {
  const { id } = useParams()
  const detail = usePlacementDetail(Number(id))

  if (detail.isLoading) return <p className="text-slate-500">Loading...</p>
  if (detail.isError || !detail.data) return <p className="text-red-600">Student not found.</p>

  const data = detail.data

  return (
    <div className="space-y-6">
      <Link to="/admin/placement" className="text-sm text-indigo-600 hover:underline">
        ← Back to the placement test
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 wrap-anywhere">{data.student.name}</h1>
        <p className="text-slate-500 wrap-anywhere">{data.student.email}</p>
        {data.student.status === 'pending' && (
          <p className="mt-1 text-sm text-amber-700">
            This account is waiting for approval. You can approve it on the Students page.
          </p>
        )}
      </div>

      <WrittenResult detail={data} />
      <InterviewSheet key={data.student.id} detail={data} />
    </div>
  )
}