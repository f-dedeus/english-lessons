import { useQuery } from '@tanstack/react-query'
import { listHomework } from '../mocks/homeworkStore'

export function useHomeworkList() {
  return useQuery({ queryKey: ['homework'], queryFn: listHomework })
}