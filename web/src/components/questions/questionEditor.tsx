import type { Question } from '../../types'
import { countBlanks } from '../../utils/questions'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

const typeLabels: Record<Question['type'], string> = {
  multiple_choice: 'Multiple choice',
  open_text: 'Open question',
  fill_blanks: 'Fill in the blanks',
}

type Props = {
  question: Question
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (question: Question) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export default function QuestionEditor({ question, index, isFirst, isLast, onChange, onRemove, onMove }: Props) {
  const linkButton = 'text-indigo-600 hover:underline disabled:text-slate-300 disabled:no-underline'

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Question {index + 1} · {typeLabels[question.type]}
        </p>
        <div className="flex gap-4 text-sm">
          <button type="button" disabled={isFirst} onClick={() => onMove(-1)} className={linkButton}>↑ Up</button>
          <button type="button" disabled={isLast} onClick={() => onMove(1)} className={linkButton}>↓ Down</button>
          <button type="button" onClick={onRemove} className="text-red-600 hover:underline">Remove</button>
        </div>
      </div>

      {question.type === 'multiple_choice' && (
        <MultipleChoiceEditor question={question} onChange={onChange} />
      )}
      {question.type === 'open_text' && (
        <textarea
          rows={2}
          className={inputClass}
          placeholder="Write the question..."
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        />
      )}
      {question.type === 'fill_blanks' && <FillBlanksEditor question={question} onChange={onChange} />}
    </div>
  )
}

type MultipleChoice = Extract<Question, { type: 'multiple_choice' }>
type FillBlanks = Extract<Question, { type: 'fill_blanks' }>

function MultipleChoiceEditor({ question, onChange }: { question: MultipleChoice; onChange: (q: Question) => void }) {
  function setOption(i: number, value: string) {
    onChange({ ...question, options: question.options.map((o, j) => (j === i ? value : o)) })
  }

  function toggleCorrect(i: number) {
    if (!question.multiple) return onChange({ ...question, correct: [i] })
    const has = question.correct.includes(i)
    onChange({
      ...question,
      correct: has ? question.correct.filter((c) => c !== i) : [...question.correct, i],
    })
  }

  function removeOption(i: number) {
    onChange({
      ...question,
      options: question.options.filter((_, j) => j !== i),
      correct: question.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
    })
  }

  function setMultiple(multiple: boolean) {
    onChange({ ...question, multiple, correct: multiple ? question.correct : question.correct.slice(0, 1) })
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={2}
        className={inputClass}
        placeholder="Write the question..."
        value={question.prompt}
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={question.multiple} onChange={(e) => setMultiple(e.target.checked)} />
        More than one correct answer
      </label>

      <div className="space-y-2">
        {question.options.map((option, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type={question.multiple ? 'checkbox' : 'radio'}
              name={`correct-${question.id}`}
              checked={question.correct.includes(i)}
              onChange={() => toggleCorrect(i)}
              title="Mark as correct"
            />
            <input
              className={inputClass}
              placeholder={`Option ${i + 1}`}
              value={option}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {question.options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} className="text-sm text-red-600 hover:underline">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange({ ...question, options: [...question.options, ''] })}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          + Add option
        </button>
        <span className="text-xs text-slate-400">Tick the correct answer{question.multiple ? 's' : ''}.</span>
      </div>
    </div>
  )
}

function FillBlanksEditor({ question, onChange }: { question: FillBlanks; onChange: (q: Question) => void }) {
  function setText(text: string) {
    // Keep one answer slot per blank, preserving what was already typed
    const blanks = countBlanks(text)
    onChange({
      ...question,
      text,
      answers: Array.from({ length: blanks }, (_, i) => question.answers[i] ?? ''),
    })
  }

  function setAnswer(i: number, value: string) {
    onChange({ ...question, answers: question.answers.map((a, j) => (j === i ? value : a)) })
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={2}
        className={inputClass}
        placeholder="She ___ to school every day."
        value={question.text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-xs text-slate-400">
        Type three underscores (___) where each blank goes. Use | to accept alternatives, like goes|go.
      </p>

      {question.answers.map((answer, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-sm text-slate-600">Blank {i + 1}</span>
          <input
            className={inputClass}
            placeholder="Correct answer"
            value={answer}
            onChange={(e) => setAnswer(i, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}