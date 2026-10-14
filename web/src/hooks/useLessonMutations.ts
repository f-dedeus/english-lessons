import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LessonInput } from '../types'
import { createLesson, updateLesson, deleteLesson, duplicateLesson } from '../mocks/lessonStore'

// Every query key starting with 'lessons' (student list, single lesson, admin list) gets refreshed
function useRefreshLessons() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['lessons'] })
}

export function useCreateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (input: LessonInput) => createLesson(input),
    onSuccess: refresh,
  })
}

export function useUpdateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<LessonInput> }) => updateLesson(id, patch),
    onSuccess: refresh,
  })
}

export function useDeleteLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (id: number) => deleteLesson(id),
    onSuccess: refresh,
  })
}

export function useDuplicateLesson() {
  const refresh = useRefreshLessons()
  return useMutation({
    mutationFn: (id: number) => duplicateLesson(id),
    onSuccess: refresh,
  })
}