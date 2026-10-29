import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Answer, PlacementState } from '../types'

export function usePlacement(enabled = true) {
  return useQuery({
    queryKey: ['placement'],
    queryFn: () => api.get<PlacementState>('/me/placement'),
    enabled,
    retry: false,
  })
}

// Starts the clock
export function useStartPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/me/placement/start'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement'] }),
  })
}

export function useSubmitPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: Record<number, Answer>) => api.post<void>('/me/placement/submit', { answers }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement'] }),
  })
}

// The final level the teacher recorded after the interview (nothing until then)
export function useMyLevel() {
  return useQuery({
    queryKey: ['myLevel'],
    queryFn: () => api.get<{ finalLevel?: string }>('/me/level'),
  })
}