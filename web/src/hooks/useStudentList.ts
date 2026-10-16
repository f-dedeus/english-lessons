import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Student } from '../types'

export function useStudentList() {
  return useQuery({ queryKey: ['students'], queryFn: () => api.get<Student[]>('/students') })
}