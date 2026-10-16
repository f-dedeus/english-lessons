import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Student, StudentInput } from '../types'

function useRefreshStudents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['students'] })
}

export function useCreateStudent() {
  const refresh = useRefreshStudents()
  return useMutation({
    mutationFn: (input: StudentInput) =>
      api.post<{ student: Student; temporaryPassword: string }>('/students', input),
    onSuccess: refresh,
  })
}

type StudentPatch = Partial<{ name: string; email: string; status: 'active' | 'inactive' }>

// Also used to approve a pending sign-up (status: 'active')
export function useUpdateStudent() {
  const refresh = useRefreshStudents()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: StudentPatch }) =>
      api.patch<Student>(`/students/${id}`, patch),
    onSuccess: refresh,
  })
}

// Removes a pending sign-up
export function useRejectStudent() {
  const refresh = useRefreshStudents()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/students/${id}`),
    onSuccess: refresh,
  })
}

export function useResetStudentPassword() {
  return useMutation({
    mutationFn: (id: number) =>
      api.post<{ temporaryPassword: string }>(`/students/${id}/reset-password`),
  })
}