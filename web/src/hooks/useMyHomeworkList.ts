import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { listAssignmentsForStudent } from '../mocks/homeworkStore'

export function useMyHomeworkList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['myHomework', user?.id],
    queryFn: () => listAssignmentsForStudent(user!.id),
    enabled: !!user,
  })
}