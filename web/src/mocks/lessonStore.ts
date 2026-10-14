import type { Lesson, LessonInput } from '../types'
import { mockLessons } from './lessons'

const delay = () => new Promise((r) => setTimeout(r, 300))

let idCounter = 0
export const newId = () => Date.now() + idCounter++

const nextLessonId = () => Math.max(0, ...mockLessons.map((l) => l.id)) + 1

function findIndex(id: number) {
  const index = mockLessons.findIndex((l) => l.id === id)
  if (index === -1) throw new Error('Lesson not found')
  return index
}

// Unlike the student list, this includes drafts
export async function listAllLessons(): Promise<Lesson[]> {
  await delay()
  return [...mockLessons]
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  await delay()
  const lesson: Lesson = { ...input, id: nextLessonId() }
  mockLessons.push(lesson)
  return lesson
}

export async function updateLesson(id: number, patch: Partial<LessonInput>): Promise<Lesson> {
  await delay()
  const index = findIndex(id)
  mockLessons[index] = { ...mockLessons[index], ...patch }
  return mockLessons[index]
}

export async function deleteLesson(id: number): Promise<void> {
  await delay()
  mockLessons.splice(findIndex(id), 1)
}

export async function duplicateLesson(id: number): Promise<Lesson> {
  await delay()
  const original = mockLessons[findIndex(id)]
  const copy: Lesson = {
    ...original,
    id: nextLessonId(),
    title: `${original.title} (copy)`,
    status: 'draft',
    materials: original.materials.map((m) => ({ ...m, id: newId() })),
  }
  mockLessons.push(copy)
  return copy
}