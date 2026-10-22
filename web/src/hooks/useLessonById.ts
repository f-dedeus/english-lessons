import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Lesson } from '../types'

export function useLessonById(id: number) {
  return useQuery({
    queryKey: ['lessons', 'student', 'detail', id],
    queryFn: () => api.get<Lesson>(`/me/lessons/${id}`),
    enabled: Number.isFinite(id),
    retry: false,
  })
}