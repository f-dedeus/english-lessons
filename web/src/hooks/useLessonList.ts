import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { listLessonsForStudent } from '../mocks/assignmentStore'

export function useLessonList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['lessons', 'student', user?.id],
    queryFn: () => listLessonsForStudent(user!.id),
    enabled: !!user,
  })
}