import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { listNotesForStudent } from '../mocks/noteStore'

export function useNoteList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notes', 'student', user?.id],
    queryFn: () => listNotesForStudent(user!.id),
    enabled: !!user,
  })
}