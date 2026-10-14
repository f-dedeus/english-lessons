export type QuestionContent =
  | { type: 'multiple_choice'; prompt: string; options: string[]; correct: number[]; multiple: boolean }
  | { type: 'open_text'; prompt: string }
  | { type: 'fill_blanks'; text: string; answers: string[] }

export type Answer =
  | { type: 'multiple_choice'; selected: number[] }
  | { type: 'open_text'; text: string }
  | { type: 'fill_blanks'; values: string[] }

// Keyed by question id (JSON object keys are always strings)
export type SubmissionAnswers = Record<string, Answer>