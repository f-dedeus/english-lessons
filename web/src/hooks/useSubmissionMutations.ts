import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { submitHomework, gradeSubmission } from '../mocks/homeworkStore'
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

export function useSubmitHomework() {
  const { user } = useAuth()
  const refresh = useRefresh()

  return useMutation({
    mutationFn: ({ assignmentId, answers }: { assignmentId: number; answers: Record<number, Answer> }) =>
      submitHomework({ studentId: user!.id, assignmentId, answers }),
    onSuccess: refresh,
  })
}

export function useGradeSubmission() {
  const refresh = useRefresh()

  return useMutation({
    mutationFn: (input: { assignmentId: number; grade: number; feedback: string }) =>
      gradeSubmission(input),
    onSuccess: refresh,
  })
}