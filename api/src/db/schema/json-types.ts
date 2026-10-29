export type QuestionContent =
  | {
      type: 'multiple_choice'
      prompt: string
      options: string[]
      correct: number[]
      multiple: boolean
      passage?: string // optional reading text shown above a group of questions
    }
  | { type: 'open_text'; prompt: string }
  | { type: 'fill_blanks'; text: string; answers: string[] }

export type Answer =
  | { type: 'multiple_choice'; selected: number[] }
  | { type: 'open_text'; text: string }
  | { type: 'fill_blanks'; values: string[] }

// Keyed by question id (JSON object keys are always strings)
export type SubmissionAnswers = Record<string, Answer>

export type PlacementResult = {
  blocks: { level: string; correct: number; total: number; passed: boolean }[]
  writtenLevel: string // 'Pre-A1' | 'A1 initial' | 'A1' | 'A2' | 'B1'
  possiblyAboveB1: boolean
}

export type InterviewMark = 'Pre-A1' | 'A1' | 'A2' | 'B1'

export type InterviewScores = {
  comprehension: InterviewMark
  fluency: InterviewMark
  grammar: InterviewMark
  vocabulary: InterviewMark
  pronunciation: InterviewMark
}