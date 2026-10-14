import { useState, type FormEvent } from 'react'
import type { HomeworkInput, Lesson, Question } from '../../types'
import { newId } from '../../mocks/lessonStore'
import { newQuestion, validateQuestion } from '../../utils/questions'
import QuestionEditor from '../questions/questionEditor'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

const addButtons = [
  { type: 'multiple_choice', label: '+ Multiple choice' },
  { type: 'open_text', label: '+ Open question' },
  { type: 'fill_blanks', label: '+ Fill in the blanks' },
] as const

type Props = {
  lessons: Lesson[]
  initial?: HomeworkInput
  submitLabel: string
  submitting: boolean
  onSubmit: (input: HomeworkInput) => void
}

export default function HomeworkForm({ lessons, initial, submitLabel, submitting, onSubmit }: Props) {
  const [lessonId, setLessonId] = useState(initial ? String(initial.lessonId) : '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [questions, setQuestions] = useState<Question[]>(initial?.questions ?? [])
  const [error, setError] = useState<string | null>(null)

  function updateQuestion(index: number, question: Question) {
    setQuestions((prev) => prev.map((old, i) => (i === index ? question : old)))
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const moved = next[index]
      next[index] = next[target]
      next[target] = moved
      return next
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!lessonId) return setError('Choose the lesson this homework belongs to.')
    if (!title.trim()) return setError('The homework needs a title.')
    if (questions.length === 0) return setError('Add at least one question.')

    for (let i = 0; i < questions.length; i++) {
      const problem = validateQuestion(questions[i])
      if (problem) return setError(`Question ${i + 1}: ${problem}`)
    }

    setError(null)
    onSubmit({
      lessonId: Number(lessonId),
      title: title.trim(),
      instructions: instructions.trim(),
      questions,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Lesson</label>
          <select className={inputClass} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">Choose a lesson...</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
                {l.status === 'draft' ? ' (draft)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Instructions (optional)</label>
          <textarea
            className={inputClass}
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Questions</h2>

        {questions.length === 0 && (
          <p className="text-sm text-slate-500">No questions yet. Add one with the buttons below.</p>
        )}

        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            isFirst={i === 0}
            isLast={i === questions.length - 1}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
            onMove={(direction) => moveQuestion(i, direction)}
          />
        ))}

        <div className="flex flex-wrap gap-3">
          {addButtons.map((b) => (
            <button
              key={b.type}
              type="button"
              onClick={() => setQuestions((prev) => [...prev, newQuestion(b.type, newId())])}
              className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}