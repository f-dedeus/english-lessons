import { asc, eq, inArray, type SQL } from 'drizzle-orm'
import { db } from './client.ts'
import { homework, homeworkAssignments, homeworkQuestions, submissions } from './schema/index.ts'
import type { QuestionContent } from './schema/json-types.ts'

type StoredQuestion = { id: number; content: QuestionContent }
export type QuestionOut = QuestionContent & { id: number }

export const toQuestion = (q: StoredQuestion): QuestionOut => ({ id: q.id, ...q.content })

// Students must not receive the answer key before the homework is graded
export function hideAnswers(q: QuestionOut): QuestionOut {
  if (q.type === 'multiple_choice') return { ...q, correct: [] }
  if (q.type === 'fill_blanks') return { ...q, answers: [] }
  return q
}

export async function fetchQuestions(homeworkIds: number[]) {
  const byHomework = new Map<number, StoredQuestion[]>()
  if (homeworkIds.length === 0) return byHomework

  const rows = await db
    .select()
    .from(homeworkQuestions)
    .where(inArray(homeworkQuestions.homeworkId, homeworkIds))
    .orderBy(asc(homeworkQuestions.position), asc(homeworkQuestions.id))

  for (const row of rows) {
    const list = byHomework.get(row.homeworkId) ?? []
    list.push({ id: row.id, content: row.content })
    byHomework.set(row.homeworkId, list)
  }
  return byHomework
}

// Homework library entries, with questions and whether they are locked
export async function fetchHomework(where?: SQL) {
  const rows = await db.select().from(homework).where(where).orderBy(asc(homework.id))
  const ids = rows.map((h) => h.id)
  const questions = await fetchQuestions(ids)

  const locked = new Set<number>()
  if (ids.length > 0) {
    const lockedRows = await db
      .selectDistinct({ homeworkId: homeworkAssignments.homeworkId })
      .from(submissions)
      .innerJoin(homeworkAssignments, eq(submissions.homeworkAssignmentId, homeworkAssignments.id))
      .where(inArray(homeworkAssignments.homeworkId, ids))
    for (const row of lockedRows) locked.add(row.homeworkId)
  }

  return rows.map((h) => ({
    id: h.id,
    lessonId: h.lessonId,
    title: h.title,
    instructions: h.instructions,
    locked: locked.has(h.id),
    questions: (questions.get(h.id) ?? []).map(toQuestion),
  }))
}

// One student's copy of a homework: assignment + homework + questions + their answers
export async function fetchDetails(where: SQL) {
  const rows = await db
    .select({ assignment: homeworkAssignments, hw: homework, submission: submissions })
    .from(homeworkAssignments)
    .innerJoin(homework, eq(homeworkAssignments.homeworkId, homework.id))
    .leftJoin(submissions, eq(submissions.homeworkAssignmentId, homeworkAssignments.id))
    .where(where)
    .orderBy(asc(homeworkAssignments.dueDate), asc(homeworkAssignments.id))

  const questions = await fetchQuestions([...new Set(rows.map((r) => r.hw.id))])

  return rows.map(({ assignment, hw, submission }) => ({
    id: assignment.id,
    studentId: assignment.studentId,
    lessonId: hw.lessonId,
    title: hw.title,
    instructions: hw.instructions,
    questions: (questions.get(hw.id) ?? []).map(toQuestion),
    dueDate: assignment.dueDate,
    status: assignment.status,
    answers: submission?.answers,
    submittedAt: submission?.submittedAt.toISOString(),
    grade: submission?.grade ?? undefined,
    feedback: submission?.feedback ?? undefined,
  }))
}