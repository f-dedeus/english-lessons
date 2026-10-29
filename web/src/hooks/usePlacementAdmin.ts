import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from './useAuth'
import type {
  FinalLevel,
  InterviewScores,
  PlacementDetail,
  PlacementOverviewRow,
  PlacementSettings,
} from '../types'

const overviewQuery = {
  queryKey: ['placementAdmin', 'overview'],
  queryFn: () => api.get<PlacementOverviewRow[]>('/placement/overview'),
}

export function usePlacementOverview() {
  return useQuery(overviewQuery)
}

// For the navbar: finished tests still waiting for the interview
export function usePlacementWaitingCount(): number {
  const { user } = useAuth()
  const query = useQuery({
    ...overviewQuery,
    enabled: user?.role === 'teacher',
    select: (rows) => rows.filter((r) => r.testState === 'submitted' && !r.finalLevel).length,
  })
  return query.data ?? 0
}

export function usePlacementDetail(studentId: number) {
  return useQuery({
    queryKey: ['placementAdmin', 'detail', studentId],
    queryFn: () => api.get<PlacementDetail>(`/placement/students/${studentId}`),
    enabled: Number.isFinite(studentId),
    retry: false,
  })
}

export function usePlacementSettings() {
  return useQuery({
    queryKey: ['placementAdmin', 'settings'],
    queryFn: () => api.get<PlacementSettings>('/placement/settings'),
  })
}

function useRefresh() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['placementAdmin'] })
}

export function useSaveInterview() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({
      studentId,
      ...body
    }: {
      studentId: number
      interviewedOn: string
      scores: InterviewScores
      finalLevel: FinalLevel
      notes: string
    }) => api.put<void>(`/placement/students/${studentId}/interview`, body),
    onSuccess: refresh,
  })
}

// Deletes the test attempt so the student can take it again
export function useRetakePlacement() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (studentId: number) => api.post<void>(`/placement/students/${studentId}/retake`),
    onSuccess: refresh,
  })
}

export function useRequirePlacement() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ studentId, required }: { studentId: number; required: boolean }) =>
      api.put<void>(`/placement/students/${studentId}/required`, { required }),
    onSuccess: refresh,
  })
}

export function useSaveSettings() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (settings: PlacementSettings) => api.put<void>('/placement/settings', settings),
    onSuccess: refresh,
  })
}