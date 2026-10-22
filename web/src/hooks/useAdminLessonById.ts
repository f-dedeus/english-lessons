import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Lesson } from '../types'

export function useAdminLessonById(id: number) {
  return useQuery({
    queryKey: ['lessons', 'admin', 'detail', id],
    queryFn: () => api.get<Lesson>(`/lessons/${id}`),
    enabled: Number.isFinite(id),
    retry: false,
  })
}