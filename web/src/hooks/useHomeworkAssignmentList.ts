import { useQuery } from '@tanstack/react-query'
import { listHomeworkAssignments } from '../mocks/homeworkStore'

export function useHomeworkAssignmentList() {
  return useQuery({ queryKey: ['homeworkAssignments'], queryFn: listHomeworkAssignments })
}