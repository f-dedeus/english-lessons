import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note, NoteInput } from '../types'
import { createNote, updateNote, deleteNote } from '../mocks/noteStore'

function useRefreshNotes() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['notes'] })
}

export function useCreateNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: (input: NoteInput) => createNote(input),
    onSuccess: refresh,
  })
}

export function useUpdateNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Pick<Note, 'pinned' | 'dismissed'>> }) =>
      updateNote(id, patch),
    onSuccess: refresh,
  })
}

export function useDeleteNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: (id: number) => deleteNote(id),
    onSuccess: refresh,
  })
}