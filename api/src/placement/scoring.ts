import type { Answer, PlacementResult, QuestionContent } from '../db/schema/json-types.ts'

export const LEVELS = ['A1', 'A2', 'B1'] as const

const PASS_RATE = 0.7 // 7 of 10 passes a block

type ScoredQuestion = { id: number; level: string; content: QuestionContent }

function isCorrect(content: QuestionContent, answer: Answer | undefined): boolean {
  if (!answer) return false // a blank answer is simply not correct (no penalty)
  if (content.type === 'multiple_choice' && answer.type === 'multiple_choice') {
    const chosen = [...answer.selected].sort((a, b) => a - b)
    const correct = [...content.correct].sort((a, b) => a - b)
    return chosen.length === correct.length && chosen.every((v, i) => v === correct[i])
  }
  return false // the placement test only scores multiple choice
}

export function scorePlacement(
  questions: ScoredQuestion[],
  answers: Record<string, Answer>,
): PlacementResult {
  const blocks = LEVELS.map((level) => {
    const inBlock = questions.filter((q) => q.level === level)
    const correct = inBlock.filter((q) => isCorrect(q.content, answers[String(q.id)])).length
    const total = inBlock.length
    return { level: level as string, correct, total, passed: total > 0 && correct / total >= PASS_RATE }
  })

  // The written level is the last block passed in sequence
  let reached = -1
  for (const [index, block] of blocks.entries()) {
    if (block.passed) reached = index
    else break
  }

  let writtenLevel: string
  if (reached >= 0) {
    writtenLevel = blocks[reached].level
  } else {
    // Block 1 not passed: 0-3 of 10 is Pre-A1, 4-6 is "A1 initial"
    const first = blocks[0]
    writtenLevel = first.total > 0 && first.correct / first.total < 0.4 ? 'Pre-A1' : 'A1 initial'
  }

  // Passed the last block with 9 or 10 of 10: possibly above B1
  const last = blocks[blocks.length - 1]
  const possiblyAboveB1 =
    reached === blocks.length - 1 && last.total > 0 && last.correct / last.total >= 0.9

  return { blocks, writtenLevel, possiblyAboveB1 }
}