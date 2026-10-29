import { useState } from 'react'
import type { CriterionKey, FinalLevel, InterviewScores, Mark, PlacementDetail } from '../../types'
import { useSaveInterview } from '../../hooks/usePlacementAdmin'
import { CRITERIA, FINAL_LEVELS, MARKS, computeOralLevel, suggestFinalLevel } from '../../utils/rubric'
import { todayString } from '../../utils/dates'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

export default function InterviewSheet({ detail }: { detail: PlacementDetail }) {
  const save = useSaveInterview()
  const interview = detail.interview

  const [date, setDate] = useState(interview?.interviewedOn ?? todayString())
  const [marks, setMarks] = useState<Partial<Record<CriterionKey, Mark>>>(interview?.scores ?? {})
  const [finalChoice, setFinalChoice] = useState<FinalLevel | ''>((interview?.finalLevel as FinalLevel) ?? '')
  const [notes, setNotes] = useState(interview?.notes ?? '')
  const [saved, setSaved] = useState(false)

  const complete = CRITERIA.every((c) => marks[c.key] !== undefined)
  const oral = complete ? computeOralLevel(marks as InterviewScores) : null
  const suggestion = oral
    ? suggestFinalLevel(detail.attempt?.writtenLevel, oral.level, detail.attempt?.possiblyAboveB1)
    : null

  // Until the teacher chooses, the suggestion is used
  const finalLevel = finalChoice || suggestion?.level || ''

  function mark(key: CriterionKey, value: Mark) {
    setSaved(false)
    setMarks((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!complete || !finalLevel) return
    save.mutate(
      {
        studentId: detail.student.id,
        interviewedOn: date,
        scores: marks as InterviewScores,
        finalLevel,
        notes,
      },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Interview sheet</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setSaved(false)
              setDate(e.target.value)
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        For each criterion, mark the column that describes the student. The oral level is the column that
        fits at least 3 of the 5 criteria.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-2 py-2 font-medium">Critério</th>
              {MARKS.map((m) => (
                <th key={m} className="px-2 py-2 font-medium">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.key} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-2 py-2 font-medium text-slate-800">{c.label}</td>
                {MARKS.map((m) => (
                  <td key={m} className="px-1 py-1">
                    <label
                      className={`flex cursor-pointer gap-2 rounded-md p-2 hover:bg-slate-50 ${
                        marks[c.key] === m ? 'bg-indigo-50 ring-1 ring-indigo-300' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`criterion-${c.key}`}
                        checked={marks[c.key] === m}
                        onChange={() => mark(c.key, m)}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-slate-600">
                        {m === 'Pre-A1' ? 'Abaixo do A1' : c.descriptors[m]}
                      </span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <p className="text-slate-700">
          <span className="font-medium">Written result:</span> {detail.attempt?.writtenLevel ?? 'not taken'}
        </p>

        {oral ? (
          <>
            <p className="text-slate-700">
              <span className="font-medium">Oral level:</span> {oral.level}{' '}
              <span className="text-slate-500">
                ({oral.marksAtLevel} of 5 criteria)
              </span>
            </p>
            {!oral.clear && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">
                No level fits 3 of the 5 criteria, so the middle mark is proposed. Please review the marks.
              </p>
            )}
            {suggestion && (
              <div className="space-y-1">
                <p className="text-slate-700">
                  <span className="font-medium">Suggested final level:</span> {suggestion.level}
                </p>
                {suggestion.hint && <p className="text-slate-600">{suggestion.hint}</p>}
                {suggestion.extra && <p className="text-slate-600">{suggestion.extra}</p>}
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-500">Mark all five criteria to see the oral level and the suggestion.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Final level</label>
        <select
          value={finalLevel}
          onChange={(e) => {
            setSaved(false)
            setFinalChoice(e.target.value as FinalLevel)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choose...
          </option>
          {FINAL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">The student sees this level on their dashboard.</span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Observações (pontos fortes e dificuldades)
        </label>
        <textarea
          rows={4}
          maxLength={2000}
          className={inputClass}
          value={notes}
          onChange={(e) => {
            setSaved(false)
            setNotes(e.target.value)
          }}
        />
      </div>

      {save.isError && <p className="text-sm text-red-600">{save.error.message}</p>}
      {saved && <p className="text-sm text-green-700">Saved. Final level: {finalLevel}.</p>}

      <button
        onClick={handleSave}
        disabled={!complete || !finalLevel || save.isPending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {save.isPending ? 'Saving...' : interview ? 'Update interview' : 'Save interview'}
      </button>
    </section>
  )
}