import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getHomeworkForStudent } from '../mocks/homeworkStore'

export function useMyHomeworkById(assignmentId: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['myHomework', user?.id, assignmentId],
    queryFn: () => getHomeworkForStudent(user!.id, assignmentId),
    enabled: !!user && Number.isFinite(assignmentId),
    retry: false,
  })
}