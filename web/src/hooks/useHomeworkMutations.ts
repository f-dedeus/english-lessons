import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Homework, HomeworkInput } from '../types'

// Refreshes the teacher's lists, the student's homework and the submissions list
function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['homework'] }),
      queryClient.invalidateQueries({ queryKey: ['homeworkAssignments'] }),
      queryClient.invalidateQueries({ queryKey: ['myHomework'] }),
      queryClient.invalidateQueries({ queryKey: ['submissions'] }),
    ])
}

export function useCreateHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: HomeworkInput) => api.post<Homework>('/homework', input),
    onSuccess: refresh,
  })
}

export function useUpdateHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<HomeworkInput> }) =>
      api.patch<Homework>(`/homework/${id}`, patch),
    onSuccess: refresh,
  })
}

export function useDeleteHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/homework/${id}`),
    onSuccess: refresh,
  })
}

export function useDuplicateHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => api.post<Homework>(`/homework/${id}/duplicate`),
    onSuccess: refresh,
  })
}

export function useAssignHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { homeworkId: number; studentIds: number[]; dueDate: string }) =>
      api.post<void>(`/homework/${input.homeworkId}/assign`, {
        studentIds: input.studentIds,
        dueDate: input.dueDate,
      }),
    onSuccess: refresh,
  })
}

export function useUnassignHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (assignmentId: number) => api.delete<void>(`/homework-assignments/${assignmentId}`),
    onSuccess: refresh,
  })
}

// Another attempt: deletes the answer and grade (if any) and resets the timer
export function useResetHomeworkAssignment() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (assignmentId: number) => api.post<void>(`/homework-assignments/${assignmentId}/reset`),
    onSuccess: refresh,
  })
}