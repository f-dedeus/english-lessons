import type { InterviewMark, InterviewScores } from '../db/schema/json-types.ts'

export const MARKS = ['Pre-A1', 'A1', 'A2', 'B1'] as const
export const FINAL_LEVELS = ['Pre-A1', 'A1', 'A2', 'B1', 'Above B1'] as const

// "The oral level is the column where the student fits at least 3 of the 5 criteria"
export function computeOralLevel(scores: InterviewScores): InterviewMark {
  const marks = Object.values(scores)

  for (const mark of MARKS) {
    if (marks.filter((m) => m === mark).length >= 3) return mark
  }

  // No column has 3 criteria: use the middle mark (the screen warns the teacher to review it)
  const sorted = marks.map((m) => MARKS.indexOf(m)).sort((a, b) => a - b)
  return MARKS[sorted[2]]
}