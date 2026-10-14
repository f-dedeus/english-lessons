import { useState, type FormEvent } from 'react'
import type { SubmissionRow } from '../../types'
import { useGradeSubmission } from '../../hooks/useSubmissionMutations'
import { autoSummary } from '../../utils/questions'
import QuestionReview from '../questions/questionReview'

type Props = { row: SubmissionRow; onDone: () => void }

export default function GradePanel({ row, onDone }: Props) {
  const grade = useGradeSubmission()

  const summary = autoSummary(row.questions, row.answers)
  const suggested =
    summary.total > 0 && summary.manual === 0
      ? Math.round((summary.correct / summary.total) * 100) / 10
      : undefined

  const [value, setValue] = useState(row.grade?.toString() ?? suggested?.toString() ?? '')
  const [feedback, setFeedback] = useState(row.feedback ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const number = Number(value)
    if (value.trim() === '' || !Number.isFinite(number) || number < 0 || number > 10) {
      return setError('Enter a grade between 0 and 10.')
    }
    setError(null)
    grade.mutate({ assignmentId: row.id, grade: number, feedback }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-slate-200 pt-4">
      {row.instructions && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Instructions</p>
          <p className="whitespace-pre-wrap text-sm text-slate-500">{row.instructions}</p>
        </div>
      )}

      <div className="space-y-3">
        {row.questions.map((q, i) => (
          <QuestionReview key={q.id} question={q} answer={row.answers?.[q.id]} index={i} />
        ))}
      </div>

      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {summary.total > 0 && `Auto-graded: ${summary.correct} of ${summary.total} correct. `}
        {summary.manual > 0 &&
          `${summary.manual} open question${summary.manual === 1 ? '' : 's'} need${summary.manual === 1 ? 's' : ''} your review.`}
        {suggested !== undefined && ` Suggested grade: ${suggested}/10.`}
      </p>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Grade (0-10)</label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-60 flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Feedback</label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {grade.isError && <p className="text-sm text-red-600">{grade.error.message}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={grade.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {grade.isPending ? 'Saving...' : 'Save grade'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}