import type { Answer, Question } from '../types'

// ---- Blanks in "fill in the blanks" sentences ----

export const splitOnBlanks = (text: string) => text.split(/_{3,}/)
export const countBlanks = (text: string) => splitOnBlanks(text).length - 1

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

// "goes|go" accepts either one
export const matchesBlank = (expected: string, given: string) =>
  expected.split('|').some((option) => normalize(option) === normalize(given))

// ---- Creating questions ----

export function newQuestion(type: Question['type'], id: number): Question {
  switch (type) {
    case 'multiple_choice':
      return { id, type, prompt: '', options: ['', ''], correct: [], multiple: false }
    case 'open_text':
      return { id, type, prompt: '' }
    case 'fill_blanks':
      return { id, type, text: '', answers: [] }
  }
}

export function emptyAnswer(question: Question): Answer {
  switch (question.type) {
    case 'multiple_choice':
      return { type: 'multiple_choice', selected: [] }
    case 'open_text':
      return { type: 'open_text', text: '' }
    case 'fill_blanks':
      return { type: 'fill_blanks', values: Array(countBlanks(question.text)).fill('') }
  }
}

// ---- Validation (teacher side) ----

export function validateQuestion(q: Question): string | null {
  if (q.type === 'open_text') {
    return q.prompt.trim() ? null : 'write the question.'
  }

  if (q.type === 'multiple_choice') {
    if (!q.prompt.trim()) return 'write the question.'
    if (q.options.length < 2 || q.options.some((o) => !o.trim())) {
      return 'it needs at least two options, and none can be empty.'
    }
    if (q.correct.length === 0) return 'mark the correct answer.'
    if (!q.multiple && q.correct.length !== 1) return 'mark exactly one correct answer.'
    return null
  }

  const blanks = countBlanks(q.text)
  if (blanks < 1) return 'the sentence needs at least one blank (___).'
  if (q.answers.length !== blanks || q.answers.some((a) => !a.trim())) {
    return 'fill in the answer for every blank.'
  }
  return null
}

// ---- Answering and grading ----

// Has the student actually answered this question? (student side)
export function isAnswered(q: Question, a: Answer | undefined): boolean {
  if (!a) return false
  if (q.type === 'multiple_choice' && a.type === 'multiple_choice') return a.selected.length > 0
  if (q.type === 'open_text' && a.type === 'open_text') return a.text.trim().length > 0
  if (q.type === 'fill_blanks' && a.type === 'fill_blanks') {
    return a.values.length === countBlanks(q.text) && a.values.every((v) => v.trim() !== '')
  }
  return false
}

// true / false for auto-graded types, null for open questions (the teacher decides)
export function checkAnswer(q: Question, a: Answer | undefined): boolean | null {
  if (q.type === 'open_text') return null
  if (!a) return false

  if (q.type === 'multiple_choice' && a.type === 'multiple_choice') {
    const chosen = [...a.selected].sort((x, y) => x - y)
    const correct = [...q.correct].sort((x, y) => x - y)
    return chosen.length === correct.length && chosen.every((v, i) => v === correct[i])
  }

  if (q.type === 'fill_blanks' && a.type === 'fill_blanks') {
    return (
      q.answers.length === a.values.length &&
      q.answers.every((expected, i) => matchesBlank(expected, a.values[i]))
    )
  }

  return false
}

export function autoSummary(questions: Question[], answers: Record<number, Answer> | undefined) {
  let correct = 0
  let total = 0
  let manual = 0
  for (const q of questions) {
    const result = checkAnswer(q, answers?.[q.id])
    if (result === null) manual++
    else {
      total++
      if (result) correct++
    }
  }
  return { correct, total, manual }
}