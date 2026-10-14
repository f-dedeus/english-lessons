import { Fragment } from 'react'
import type { Answer, Question } from '../../types'
import { checkAnswer, matchesBlank, splitOnBlanks } from '../../utils/questions'

type Props = { question: Question; answer: Answer | undefined; index: number }

function ResultBadge({ result }: { result: boolean | null }) {
  if (result === null) {
    return <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Open answer</span>
  }
  return result ? (
    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Correct</span>
  ) : (
    <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">Incorrect</span>
  )
}

export default function QuestionReview({ question, answer, index }: Props) {
  const result = checkAnswer(question, answer)
  const heading = question.type === 'fill_blanks' ? 'Fill in the blanks' : question.prompt
  const values = answer?.type === 'fill_blanks' ? answer.values : []

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-slate-800">
          {index + 1}. {heading}
        </p>
        <ResultBadge result={result} />
      </div>

      {!answer && <p className="text-sm text-slate-500">No answer.</p>}

      {answer && question.type === 'multiple_choice' && (
        <ul className="space-y-1 text-sm">
          {question.options.map((option, i) => {
            const chosen = answer.type === 'multiple_choice' && answer.selected.includes(i)
            const right = question.correct.includes(i)
            const color = right ? 'text-green-700' : chosen ? 'text-red-700' : 'text-slate-600'
            return (
              <li key={i} className={color}>
                {chosen ? '☑' : '☐'} {option}
                {right && ' ✓'}
              </li>
            )
          })}
        </ul>
      )}

      {answer && question.type === 'open_text' && answer.type === 'open_text' && (
        <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-800">{answer.text}</p>
      )}

      {answer && question.type === 'fill_blanks' && (
        <>
          <p className="leading-8 text-slate-800">
            {splitOnBlanks(question.text).map((piece, i, pieces) => (
              <Fragment key={i}>
                <span>{piece}</span>
                {i < pieces.length - 1 && (
                  <span
                    className={`mx-1 rounded px-2 py-0.5 text-sm font-medium ${
                      matchesBlank(question.answers[i] ?? '', values[i] ?? '')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {values[i] || '—'}
                  </span>
                )}
              </Fragment>
            ))}
          </p>
          {result === false && (
            <p className="text-sm text-slate-600">
              Correct answers: {question.answers.map((a) => a.split('|')[0]).join(', ')}
            </p>
          )}
        </>
      )}
    </div>
  )
}