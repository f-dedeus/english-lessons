import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Homework } from '../types'

export function useHomeworkList() {
  return useQuery({ queryKey: ['homework'], queryFn: () => api.get<Homework[]>('/homework') })
}