import type { Note, NoteInput } from '../types'

export const mockNotes: Note[] = [
  {
    id: 1,
    studentId: 1,
    text: 'Remember to bring your notebook on Thursday!',
    color: 'yellow',
    pinned: true,
    dismissed: false,
    createdAt: '2026-10-12T14:00:00.000Z',
  },
]

const delay = () => new Promise((r) => setTimeout(r, 300))

// Pinned notes first, then newest first
const sortNotes = (a: Note, b: Note) =>
  Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)

// What the student sees: their notes that they haven't dismissed
export async function listNotesForStudent(studentId: number): Promise<Note[]> {
  await delay()
  return mockNotes.filter((n) => n.studentId === studentId && !n.dismissed).sort(sortNotes)
}

// What the teacher sees: everything for that student, including dismissed notes
export async function listAllNotesForStudent(studentId: number): Promise<Note[]> {
  await delay()
  return mockNotes.filter((n) => n.studentId === studentId).sort(sortNotes)
}

export async function createNote(input: NoteInput): Promise<Note> {
  await delay()
  const note: Note = {
    ...input,
    id: Math.max(0, ...mockNotes.map((n) => n.id)) + 1,
    dismissed: false,
    createdAt: new Date().toISOString(),
  }
  mockNotes.push(note)
  return note
}

export async function updateNote(
  id: number,
  patch: Partial<Pick<Note, 'pinned' | 'dismissed'>>,
): Promise<Note> {
  await delay()
  const index = mockNotes.findIndex((n) => n.id === id)
  if (index === -1) throw new Error('Note not found.')
  mockNotes[index] = { ...mockNotes[index], ...patch }
  return mockNotes[index]
}

export async function deleteNote(id: number): Promise<void> {
  await delay()
  const index = mockNotes.findIndex((n) => n.id === id)
  if (index !== -1) mockNotes.splice(index, 1)
}