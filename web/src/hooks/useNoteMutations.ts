import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Note, NoteInput } from '../types'

function useRefreshNotes() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['notes'] })
}

// Teacher
export function useCreateNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: ({ studentId, ...note }: NoteInput) =>
      api.post<Note>(`/students/${studentId}/notes`, note),
    onSuccess: refresh,
  })
}

// Teacher: pin or unpin
export function useUpdateNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { pinned: boolean } }) =>
      api.patch<Note>(`/notes/${id}`, patch),
    onSuccess: refresh,
  })
}

// Teacher
export function useDeleteNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/notes/${id}`),
    onSuccess: refresh,
  })
}

// Student: hide a note they have read
export function useDismissNote() {
  const refresh = useRefreshNotes()
  return useMutation({
    mutationFn: (id: number) => api.post<void>(`/me/notes/${id}/dismiss`),
    onSuccess: refresh,
  })
}