import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Lesson } from '../types'

export function useAdminLessonList() {
  return useQuery({
    queryKey: ['lessons', 'admin', 'list'],
    queryFn: () => api.get<Lesson[]>('/lessons'),
  })
}