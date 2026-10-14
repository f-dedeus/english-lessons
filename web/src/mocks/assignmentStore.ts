import type { Lesson, LessonAssignment } from '../types'
import { mockLessons } from './lessons'

export const mockLessonAssignments: LessonAssignment[] = [
  { id: 1, lessonId: 1, studentId: 1, assignedAt: '2026-10-01' },
  { id: 2, lessonId: 2, studentId: 1, assignedAt: '2026-10-05' },
  { id: 3, lessonId: 1, studentId: 2, assignedAt: '2026-10-05' },
]

const delay = () => new Promise((r) => setTimeout(r, 300))
const nextId = () => Math.max(0, ...mockLessonAssignments.map((a) => a.id)) + 1
const today = () => new Date().toISOString().slice(0, 10)

const isAssigned = (lessonId: number, studentId: number) =>
  mockLessonAssignments.some((a) => a.lessonId === lessonId && a.studentId === studentId)

export async function listLessonAssignments(): Promise<LessonAssignment[]> {
  await delay()
  return [...mockLessonAssignments]
}

// What a student sees: published lessons that were assigned to them
export async function listLessonsForStudent(studentId: number): Promise<Lesson[]> {
  await delay()
  const ids = new Set(
    mockLessonAssignments.filter((a) => a.studentId === studentId).map((a) => a.lessonId),
  )
  return mockLessons.filter((l) => l.status === 'published' && ids.has(l.id))
}

export async function assignLesson(lessonId: number, studentId: number): Promise<void> {
  await delay()
  if (isAssigned(lessonId, studentId)) return
  mockLessonAssignments.push({ id: nextId(), lessonId, studentId, assignedAt: today() })
}

export async function unassignLesson(assignmentId: number): Promise<void> {
  await delay()
  const index = mockLessonAssignments.findIndex((a) => a.id === assignmentId)
  if (index !== -1) mockLessonAssignments.splice(index, 1)
}

// Makes the lesson's student list exactly match `studentIds`
export async function setLessonStudents(lessonId: number, studentIds: number[]): Promise<void> {
  await delay()
  const wanted = new Set(studentIds)
  for (let i = mockLessonAssignments.length - 1; i >= 0; i--) {
    const a = mockLessonAssignments[i]
    if (a.lessonId === lessonId && !wanted.has(a.studentId)) mockLessonAssignments.splice(i, 1)
  }
  for (const studentId of wanted) {
    if (!isAssigned(lessonId, studentId)) {
      mockLessonAssignments.push({ id: nextId(), lessonId, studentId, assignedAt: today() })
    }
  }
}