import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { HomeworkInput } from '../types'
import {
  createHomework,
  updateHomework,
  deleteHomework,
  assignHomework,
  unassignHomework,
} from '../mocks/homeworkStore'

// Refreshes the teacher's lists and the student's homework view
function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['homework'] }),
      queryClient.invalidateQueries({ queryKey: ['homeworkAssignments'] }),
      queryClient.invalidateQueries({ queryKey: ['myHomework'] }),
    ])
}

export function useCreateHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: HomeworkInput) => createHomework(input),
    onSuccess: refresh,
  })
}

export function useUpdateHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<HomeworkInput> }) =>
      updateHomework(id, patch),
    onSuccess: refresh,
  })
}

export function useDeleteHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => deleteHomework(id),
    onSuccess: refresh,
  })
}

export function useAssignHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { homeworkId: number; studentIds: number[]; dueDate: string }) =>
      assignHomework(input),
    onSuccess: refresh,
  })
}

export function useUnassignHomework() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (assignmentId: number) => unassignHomework(assignmentId),
    onSuccess: refresh,
  })
}