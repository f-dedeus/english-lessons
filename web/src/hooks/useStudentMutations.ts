import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Student, StudentInput } from '../types'
import { createStudent, updateStudent } from '../mocks/studentStore'

function useRefreshStudents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['students'] })
}

export function useCreateStudent() {
  const refresh = useRefreshStudents()
  return useMutation({
    mutationFn: (input: StudentInput) => createStudent(input),
    onSuccess: refresh,
  })
}

export function useUpdateStudent() {
  const refresh = useRefreshStudents()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Student> }) =>
      updateStudent(id, patch),
    onSuccess: refresh,
  })
}