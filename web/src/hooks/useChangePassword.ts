import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.post<void>('/auth/change-password', input),
  })
}