import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Payment } from '../types'

export function usePaymentList(year: number) {
  return useQuery({
    queryKey: ['payments', year],
    queryFn: () => api.get<Payment[]>(`/payments?year=${year}`),
  })
}