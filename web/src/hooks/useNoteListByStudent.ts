import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Note } from '../types'

export function useNoteListByStudent(studentId: number) {
  return useQuery({
    queryKey: ['notes', 'admin', studentId],
    queryFn: () => api.get<Note[]>(`/students/${studentId}/notes`),
    enabled: Number.isFinite(studentId),
  })
}