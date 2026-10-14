import { useQuery } from '@tanstack/react-query'
import { listAllNotesForStudent } from '../mocks/noteStore'

export function useNoteListByStudent(studentId: number) {
  return useQuery({
    queryKey: ['notes', 'admin', studentId],
    queryFn: () => listAllNotesForStudent(studentId),
    enabled: Number.isFinite(studentId),
  })
}