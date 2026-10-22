import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Assignment } from '../types'

export function useMyHomeworkList() {
  return useQuery({
    queryKey: ['myHomework', 'list'],
    queryFn: () => api.get<Assignment[]>('/me/homework'),
  })
}