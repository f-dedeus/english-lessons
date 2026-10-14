import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignLesson, unassignLesson, setLessonStudents } from '../mocks/assignmentStore'

// Refreshes the assignment lists and every lesson list (including the student dashboard)
function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['lessonAssignments'] }),
      queryClient.invalidateQueries({ queryKey: ['lessons'] }),
    ])
}

export function useSetLessonStudents() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ lessonId, studentIds }: { lessonId: number; studentIds: number[] }) =>
      setLessonStudents(lessonId, studentIds),
    onSuccess: refresh,
  })
}

export function useAssignLesson() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ lessonId, studentId }: { lessonId: number; studentId: number }) =>
      assignLesson(lessonId, studentId),
    onSuccess: refresh,
  })
}

export function useUnassignLesson() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (assignmentId: number) => unassignLesson(assignmentId),
    onSuccess: refresh,
  })
}