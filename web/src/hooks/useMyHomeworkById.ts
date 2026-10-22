import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { HomeworkDetail } from '../types'

export function useMyHomeworkById(assignmentId: number) {
  return useQuery({
    queryKey: ['myHomework', 'detail', assignmentId],
    queryFn: () => api.get<HomeworkDetail>(`/me/homework/${assignmentId}`),
    enabled: Number.isFinite(assignmentId),
    retry: false,
  })
}