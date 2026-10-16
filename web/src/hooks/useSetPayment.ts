import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Payment } from '../types'

type Variables = { studentId: number; month: string; paid: boolean; note?: string | null }
type Context = { previous: Payment[] | undefined }

export function useSetPayment(year: number) {
  const queryClient = useQueryClient()
  const key = ['payments', year]

  return useMutation<void, Error, Variables, Context>({
    mutationFn: async ({ studentId, month, paid, note }) => {
      if (paid) {
        await api.put<Payment>(`/payments/${studentId}/${month}`, { note: note ?? null })
      } else {
        await api.delete<void>(`/payments/${studentId}/${month}`)
      }
    },

    // Update the grid immediately, before the API answers
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Payment[]>(key)

      queryClient.setQueryData<Payment[]>(key, (old = []) => {
        const others = old.filter((p) => !(p.studentId === vars.studentId && p.month === vars.month))
        return vars.paid
          ? [...others, { studentId: vars.studentId, month: vars.month, note: vars.note ?? null }]
          : others
      })

      return { previous }
    },

    // If the API failed, put the grid back as it was
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}