import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Lesson, LessonInput } from '../types'

// Every query key starting with 'lessons' (student, teacher, lists and details) gets refreshed
function useRefreshLessons() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['lessons'] })
}

export function useCreateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (input: LessonInput) => api.post<Lesson>('/lessons', input),
    onSuccess: refresh,
  })
}

export function useUpdateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<LessonInput> }) =>
      api.patch<Lesson>(`/lessons/${id}`, patch),
    onSuccess: refresh,
  })
}

export function useDeleteLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/lessons/${id}`),
    onSuccess: refresh,
  })
}

export function useDuplicateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (id: number) => api.post<Lesson>(`/lessons/${id}/duplicate`),
    onSuccess: refresh,
  })
}