import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { SubmissionRow } from '../types'

export function useSubmissionList() {
  return useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.get<SubmissionRow[]>('/submissions'),
  })
}