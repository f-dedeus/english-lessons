import { useQuery } from '@tanstack/react-query'
import type { Lesson } from '../types'
import { mockLessons } from '../mocks/lessons'

async function fetchLessonById(id: number): Promise<Lesson> {
  await new Promise((r) => setTimeout(r, 500))
  const lesson = mockLessons.find((l) => l.id === id)
  if (!lesson) throw new Error('Lesson not found')
  return lesson
}

export function useLessonById(id: number) {
  return useQuery({
    queryKey: ['lessons', id],
    queryFn: () => fetchLessonById(id),
    enabled: Number.isFinite(id),
    retry: false,
  })
}