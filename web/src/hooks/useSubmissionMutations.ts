import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Answer } from '../types'

function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myHomework'] }),
      queryClient.invalidateQueries({ queryKey: ['submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['homeworkAssignments'] }),
    ])
}

// Starts the clock of a timed homework
export function useStartHomework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: number) => api.post<void>(`/me/homework/${assignmentId}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myHomework'] }),
  })
}

export function useSubmitHomework() {
  const refresh = useRefresh()

  return useMutation({
    mutationFn: ({ assignmentId, answers }: { assignmentId: number; answers: Record<number, Answer> }) =>
      api.post<void>(`/me/homework/${assignmentId}/submit`, { answers }),
    onSuccess: refresh,
  })
}

export function useGradeSubmission() {
  const refresh = useRefresh()

  return useMutation({
    mutationFn: ({ assignmentId, grade, feedback }: { assignmentId: number; grade: number; feedback: string }) =>
      api.put<void>(`/submissions/${assignmentId}/grade`, { grade, feedback }),
    onSuccess: refresh,
  })
}