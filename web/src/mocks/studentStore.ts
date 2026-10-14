import type { Student, StudentInput } from '../types'

export const mockStudents: Student[] = [
  { id: 1, name: 'Ana', email: 'ana@example.com', active: true },
  { id: 2, name: 'Bruno', email: 'bruno@example.com', active: true },
  { id: 3, name: 'Carla', email: 'carla@example.com', active: false },
]

const delay = () => new Promise((r) => setTimeout(r, 300))

function emailTaken(email: string, ignoreId?: number) {
  return mockStudents.some(
    (s) => s.id !== ignoreId && s.email.toLowerCase() === email.toLowerCase(),
  )
}

export async function listStudents(): Promise<Student[]> {
  await delay()
  return [...mockStudents]
}

export async function createStudent(input: StudentInput): Promise<Student> {
  await delay()
  if (emailTaken(input.email)) throw new Error('A student with this email already exists.')
  const student: Student = {
    ...input,
    id: Math.max(0, ...mockStudents.map((s) => s.id)) + 1,
    active: true,
  }
  mockStudents.push(student)
  return student
}

export async function updateStudent(
  id: number,
  patch: Partial<Student>,
): Promise<Student> {
  await delay()
  const index = mockStudents.findIndex((s) => s.id === id)
  if (index === -1) throw new Error('Student not found.')
  if (patch.email && emailTaken(patch.email, id)) {
    throw new Error('A student with this email already exists.')
  }
  mockStudents[index] = { ...mockStudents[index], ...patch, id }
  return mockStudents[index]
}