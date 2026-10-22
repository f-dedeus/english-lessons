import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

// Refreshes the assignment lists and every lesson list (including the student dashboard)
function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['lessonAssignments'] }),
      queryClient.invalidateQueries({ queryKey: ['lessons'] }),
    ])
}

export function useSetLessonStudents() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ lessonId, studentIds }: { lessonId: number; studentIds: number[] }) =>
      api.put<void>(`/lessons/${lessonId}/students`, { studentIds }),
    onSuccess: refresh,
  })
}

export function useAssignLesson() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ lessonId, studentId }: { lessonId: number; studentId: number }) =>
      api.post<void>('/lesson-assignments', { lessonId, studentId }),
    onSuccess: refresh,
  })
}

export function useUnassignLesson() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (assignmentId: number) => api.delete<void>(`/lesson-assignments/${assignmentId}`),
    onSuccess: refresh,
  })
}