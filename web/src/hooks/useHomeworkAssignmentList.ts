import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { HomeworkAssignment } from '../types'

export function useHomeworkAssignmentList() {
  return useQuery({
    queryKey: ['homeworkAssignments'],
    queryFn: () => api.get<HomeworkAssignment[]>('/homework-assignments'),
  })
}