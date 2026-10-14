import { useQuery } from '@tanstack/react-query'
import { listStudents } from '../mocks/studentStore'

export function useStudentList() {
  return useQuery({ queryKey: ['students'], queryFn: listStudents })
}