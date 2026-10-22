import type { Answer, QuestionContent } from '../db/schema/json-types.ts'

export const countBlanks = (text: string) => text.split(/_{3,}/).length - 1

// A message when the question is badly built, or null when it is fine
export function checkQuestion(q: QuestionContent): string | null {
  if (q.type === 'multiple_choice') {
    if (new Set(q.correct).size !== q.correct.length) return 'The correct answers are repeated.'
    if (q.correct.some((i) => i >= q.options.length)) {
      return 'A correct answer points to an option that does not exist.'
    }
    if (!q.multiple && q.correct.length !== 1) return 'Mark exactly one correct answer.'
  }

  if (q.type === 'fill_blanks') {
    const blanks = countBlanks(q.text)
    if (blanks < 1) return 'The sentence needs at least one blank (___).'
    if (q.answers.length !== blanks) return 'Every blank needs exactly one correct answer.'
  }

  return null
}

type StoredQuestion = { id: number; content: QuestionContent }

// A message when the student's answers are incomplete or invalid, or null when they are fine
export function checkAnswers(
  questions: StoredQuestion[],
  answers: Record<string, Answer>,
): string | null {
  for (const [index, { id, content }] of questions.entries()) {
    const answer = answers[String(id)]
    const problem = `Question ${index + 1} needs a valid answer.`

    if (!answer || answer.type !== content.type) return problem

    if (content.type === 'multiple_choice' && answer.type === 'multiple_choice') {
      const picked = answer.selected
      const validOptions = picked.every((i) => i < content.options.length)
      const noRepeats = new Set(picked).size === picked.length
      const rightCount = content.multiple ? picked.length >= 1 : picked.length === 1
      if (!validOptions || !noRepeats || !rightCount) return problem
    }

    if (content.type === 'open_text' && answer.type === 'open_text') {
      if (!answer.text.trim()) return problem
    }

    if (content.type === 'fill_blanks' && answer.type === 'fill_blanks') {
      const complete =
        answer.values.length === countBlanks(content.text) && answer.values.every((v) => v.trim())
      if (!complete) return problem
    }
  }
  return null
}

// Keeps only the answers for this homework's questions, with surrounding spaces removed
export function normalizeAnswers(
  questions: StoredQuestion[],
  answers: Record<string, Answer>,
): Record<string, Answer> {
  const result: Record<string, Answer> = {}
  for (const { id } of questions) {
    const answer = answers[String(id)]
    if (answer.type === 'open_text') {
      result[String(id)] = { type: 'open_text', text: answer.text.trim() }
    } else if (answer.type === 'fill_blanks') {
      result[String(id)] = { type: 'fill_blanks', values: answer.values.map((v) => v.trim()) }
    } else {
      result[String(id)] = answer
    }
  }
  return result
}

// Compares two values ignoring the order of object keys
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => [key, canonical(v)]),
    )
  }
  return value
}

export const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))