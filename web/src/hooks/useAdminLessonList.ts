import { useQuery } from '@tanstack/react-query'
import { listAllLessons } from '../mocks/lessonStore'

export function useAdminLessonList() {
  return useQuery({ queryKey: ['lessons', 'admin'], queryFn: listAllLessons })
}