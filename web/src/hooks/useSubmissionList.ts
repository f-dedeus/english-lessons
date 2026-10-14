import { useQuery } from '@tanstack/react-query'
import { listSubmissionRows } from '../mocks/homeworkStore'

export function useSubmissionList() {
  return useQuery({ queryKey: ['submissions'], queryFn: listSubmissionRows })
}