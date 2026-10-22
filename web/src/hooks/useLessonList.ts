import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Lesson } from '../types'

export function useLessonList() {
  return useQuery({
    queryKey: ['lessons', 'student', 'list'],
    queryFn: () => api.get<Lesson[]>('/me/lessons'),
  })
}