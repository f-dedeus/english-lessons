import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Note } from '../types'

export function useNoteList() {
  return useQuery({
    queryKey: ['notes', 'student'],
    queryFn: () => api.get<Note[]>('/me/notes'),
  })
}