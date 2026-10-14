import type {
  Answer,
  Assignment,
  Homework,
  HomeworkAssignment,
  HomeworkDetail,
  HomeworkInput,
  Submission,
  SubmissionRow,
} from '../types'
import { isAnswered } from '../utils/questions'

export const mockHomework: Homework[] = [
  {
    id: 1,
    lessonId: 1,
    title: 'Write 5 sentences about your day',
    instructions: 'Take your time and use the Present Simple.',
    questions: [
      { id: 1, type: 'open_text', prompt: 'Write at least five sentences about your daily routine.' },
    ],
  },
  {
    id: 2,
    lessonId: 2,
    title: 'Past Simple exercises',
    instructions: '',
    questions: [
      {
        id: 2,
        type: 'multiple_choice',
        prompt: 'Which sentence is correct?',
        options: ['I goed to school.', 'I went to school.', 'I go to school yesterday.'],
        correct: [1],
        multiple: false,
      },
      {
        id: 3,
        type: 'fill_blanks',
        text: 'Yesterday I ___ (watch) a movie and ___ (eat) pizza.',
        answers: ['watched', 'ate'],
      },
      {
        id: 4,
        type: 'multiple_choice',
        prompt: 'Which of these verbs are irregular?',
        options: ['walk', 'go', 'eat', 'play'],
        correct: [1, 2],
        multiple: true,
      },
      { id: 5, type: 'open_text', prompt: 'Write two sentences about what you did last weekend.' },
    ],
  },
]

export const mockHomeworkAssignments: HomeworkAssignment[] = [
  { id: 1, homeworkId: 1, studentId: 1, dueDate: '2026-10-20', status: 'pending' },
  { id: 2, homeworkId: 2, studentId: 1, dueDate: '2026-10-03', status: 'graded' },
]

export const mockSubmissions: Submission[] = [
  {
    id: 1,
    homeworkAssignmentId: 2,
    answers: {
      2: { type: 'multiple_choice', selected: [1] },
      3: { type: 'fill_blanks', values: ['watched', 'ate'] },
      4: { type: 'multiple_choice', selected: [1, 2] },
      5: { type: 'open_text', text: 'I played football and watched TV.' },
    },
    submittedAt: '2026-10-02T15:00:00.000Z',
    grade: 9,
    feedback: 'Great work! Next time use more connecting words.',
  },
]

const delay = () => new Promise((r) => setTimeout(r, 300))
const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((i) => i.id)) + 1

function removeWhere<T>(items: T[], predicate: (item: T) => boolean) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (predicate(items[i])) items.splice(i, 1)
  }
}

// ---- Teacher: homework library ----

export async function listHomework(): Promise<Homework[]> {
  await delay()
  return [...mockHomework]
}

export async function createHomework(input: HomeworkInput): Promise<Homework> {
  await delay()
  const homework: Homework = { ...input, id: nextId(mockHomework) }
  mockHomework.push(homework)
  return homework
}

export async function updateHomework(id: number, patch: Partial<HomeworkInput>): Promise<Homework> {
  await delay()
  const index = mockHomework.findIndex((h) => h.id === id)
  if (index === -1) throw new Error('Homework not found.')
  mockHomework[index] = { ...mockHomework[index], ...patch }
  return mockHomework[index]
}

// Also removes the homework from every student, along with their answers
export async function deleteHomework(id: number): Promise<void> {
  await delay()
  const assignmentIds = new Set(
    mockHomeworkAssignments.filter((a) => a.homeworkId === id).map((a) => a.id),
  )
  removeWhere(mockSubmissions, (s) => assignmentIds.has(s.homeworkAssignmentId))
  removeWhere(mockHomeworkAssignments, (a) => a.homeworkId === id)
  removeWhere(mockHomework, (h) => h.id === id)
}

// ---- Teacher: giving homework to students ----

export async function listHomeworkAssignments(): Promise<HomeworkAssignment[]> {
  await delay()
  return [...mockHomeworkAssignments]
}

export async function assignHomework(input: {
  homeworkId: number
  studentIds: number[]
  dueDate: string
}): Promise<void> {
  await delay()
  for (const studentId of input.studentIds) {
    const exists = mockHomeworkAssignments.some(
      (a) => a.homeworkId === input.homeworkId && a.studentId === studentId,
    )
    if (exists) continue
    mockHomeworkAssignments.push({
      id: nextId(mockHomeworkAssignments),
      homeworkId: input.homeworkId,
      studentId,
      dueDate: input.dueDate,
      status: 'pending',
    })
  }
}

export async function unassignHomework(assignmentId: number): Promise<void> {
  await delay()
  removeWhere(mockSubmissions, (s) => s.homeworkAssignmentId === assignmentId)
  removeWhere(mockHomeworkAssignments, (a) => a.id === assignmentId)
}

// ---- Student: their own homework list ----

export async function listAssignmentsForStudent(studentId: number): Promise<Assignment[]> {
  await delay()
  return mockHomeworkAssignments
    .filter((a) => a.studentId === studentId)
    .flatMap((a) => {
      const homework = mockHomework.find((h) => h.id === a.homeworkId)
      if (!homework) return []
      const submission = mockSubmissions.find((s) => s.homeworkAssignmentId === a.id)
      const assignment: Assignment = {
        id: a.id,
        lessonId: homework.lessonId,
        title: homework.title,
        dueDate: a.dueDate,
        status: a.status,
        grade: submission?.grade,
      }
      return [assignment]
    })
    .sort((x, y) => x.dueDate.localeCompare(y.dueDate))
}

// ---- Shared helper ----

function buildDetail(assignment: HomeworkAssignment): HomeworkDetail | null {
  const homework = mockHomework.find((h) => h.id === assignment.homeworkId)
  if (!homework) return null
  const submission = mockSubmissions.find((s) => s.homeworkAssignmentId === assignment.id)
  return {
    id: assignment.id,
    lessonId: homework.lessonId,
    title: homework.title,
    instructions: homework.instructions,
    questions: homework.questions,
    dueDate: assignment.dueDate,
    status: assignment.status,
    answers: submission?.answers,
    submittedAt: submission?.submittedAt,
    grade: submission?.grade,
    feedback: submission?.feedback,
  }
}

// ---- Student: open one homework and answer it ----

// Only returns homework that belongs to this student (the real API must enforce the same rule)
export async function getHomeworkForStudent(
  studentId: number,
  assignmentId: number,
): Promise<HomeworkDetail> {
  await delay()
  const assignment = mockHomeworkAssignments.find(
    (a) => a.id === assignmentId && a.studentId === studentId,
  )
  const detail = assignment ? buildDetail(assignment) : null
  if (!detail) throw new Error('Homework not found.')
  return detail
}

export async function submitHomework(input: {
  studentId: number
  assignmentId: number
  answers: Record<number, Answer>
}): Promise<void> {
  await delay()
  const assignment = mockHomeworkAssignments.find(
    (a) => a.id === input.assignmentId && a.studentId === input.studentId,
  )
  if (!assignment) throw new Error('Homework not found.')
  if (assignment.status === 'graded') {
    throw new Error('This homework was already graded and can no longer be changed.')
  }
  const homework = mockHomework.find((h) => h.id === assignment.homeworkId)
  if (!homework) throw new Error('Homework not found.')

  if (!homework.questions.every((q) => isAnswered(q, input.answers[q.id]))) {
    throw new Error('Answer every question before sending.')
  }

  // Keep only the answers that belong to this homework's questions
  const answers = Object.fromEntries(homework.questions.map((q) => [q.id, input.answers[q.id]]))
  const submittedAt = new Date().toISOString()

  const existing = mockSubmissions.find((s) => s.homeworkAssignmentId === assignment.id)
  if (existing) {
    existing.answers = answers
    existing.submittedAt = submittedAt
  } else {
    mockSubmissions.push({
      id: nextId(mockSubmissions),
      homeworkAssignmentId: assignment.id,
      answers,
      submittedAt,
    })
  }
  assignment.status = 'submitted'
}

// ---- Teacher: read and grade answers ----

export async function listSubmissionRows(): Promise<SubmissionRow[]> {
  await delay()
  return mockHomeworkAssignments
    .flatMap((a) => {
      const detail = buildDetail(a)
      return detail && detail.answers !== undefined ? [{ ...detail, studentId: a.studentId }] : []
    })
    .sort((x, y) => (y.submittedAt ?? '').localeCompare(x.submittedAt ?? ''))
}

export async function gradeSubmission(input: {
  assignmentId: number
  grade: number
  feedback: string
}): Promise<void> {
  await delay()
  if (!Number.isFinite(input.grade) || input.grade < 0 || input.grade > 10) {
    throw new Error('The grade must be a number between 0 and 10.')
  }
  const assignment = mockHomeworkAssignments.find((a) => a.id === input.assignmentId)
  const submission = mockSubmissions.find((s) => s.homeworkAssignmentId === input.assignmentId)
  if (!assignment || !submission) throw new Error('Submission not found.')

  submission.grade = input.grade
  submission.feedback = input.feedback.trim() || undefined
  assignment.status = 'graded'
}