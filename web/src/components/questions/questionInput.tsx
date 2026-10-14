import { Fragment } from 'react'
import type { Answer, Question } from '../../types'
import { splitOnBlanks } from '../../utils/questions'

type Props = {
  question: Question
  answer: Answer
  index: number
  onChange: (answer: Answer) => void
}

export default function QuestionInput({ question, answer, index, onChange }: Props) {
  const heading = question.type === 'fill_blanks' ? 'Fill in the blanks' : question.prompt

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-medium text-slate-800">
        {index + 1}. {heading}
      </p>

      {question.type === 'multiple_choice' && answer.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options.map((option, i) => {
            const checked = answer.selected.includes(i)
            function toggle() {
              if (question.type !== 'multiple_choice' || answer.type !== 'multiple_choice') return
              if (!question.multiple) return onChange({ type: 'multiple_choice', selected: [i] })
              onChange({
                type: 'multiple_choice',
                selected: checked ? answer.selected.filter((s) => s !== i) : [...answer.selected, i],
              })
            }
            return (
              <label
                key={i}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type={question.multiple ? 'checkbox' : 'radio'}
                  name={`question-${question.id}`}
                  checked={checked}
                  onChange={toggle}
                />
                {option}
              </label>
            )
          })}
          {question.multiple && <p className="text-xs text-slate-400">Choose all that apply.</p>}
        </div>
      )}

      {question.type === 'open_text' && answer.type === 'open_text' && (
        <textarea
          rows={5}
          value={answer.text}
          onChange={(e) => onChange({ type: 'open_text', text: e.target.value })}
          placeholder="Write your answer here..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      )}

      {question.type === 'fill_blanks' && answer.type === 'fill_blanks' && (
        <p className="leading-10 text-slate-800">
          {splitOnBlanks(question.text).map((piece, i, pieces) => (
            <Fragment key={i}>
              <span>{piece}</span>
              {i < pieces.length - 1 && (
                <input
                  value={answer.values[i] ?? ''}
                  onChange={(e) =>
                    onChange({
                      type: 'fill_blanks',
                      values: pieces.slice(0, -1).map((_, j) => (j === i ? e.target.value : answer.values[j] ?? '')),
                    })
                  }
                  className="mx-1 inline-block w-32 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              )}
            </Fragment>
          ))}
        </p>
      )}
    </div>
  )
}