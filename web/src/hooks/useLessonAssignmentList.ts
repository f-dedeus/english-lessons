import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { LessonAssignment } from '../types'

export function useLessonAssignmentList() {
  return useQuery({
    queryKey: ['lessonAssignments'],
    queryFn: () => api.get<LessonAssignment[]>('/lesson-assignments'),
  })
}