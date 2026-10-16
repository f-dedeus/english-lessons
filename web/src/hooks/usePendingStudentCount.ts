import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from './useAuth'
import type { Student } from '../types'

export function usePendingStudentCount(): number {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get<Student[]>('/students'),
    enabled: user?.role === 'teacher',
    select: (students) => students.filter((s) => s.status === 'pending').length,
  })

  return query.data ?? 0
}