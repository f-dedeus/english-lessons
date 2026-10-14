import { useQuery } from '@tanstack/react-query'
import { listLessonAssignments } from '../mocks/assignmentStore'

export function useLessonAssignmentList() {
  return useQuery({ queryKey: ['lessonAssignments'], queryFn: listLessonAssignments })
}