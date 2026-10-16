export type Role = 'student' | 'teacher'

export type User = { id: number; name: string; email: string; role: Role }

// Reusable content (the library)
export type Lesson = {
  id: number
  title: string
  description: string
  status: 'draft' | 'published'
  materials: LessonMaterial[]
}

export type LessonMaterial = 
  | { id: number; type: 'video'; title: string; url: string }
  | { id: number; type: 'pdf'; title: string; url: string }
  | { id: number; type: 'audio'; title: string; url: string }

export type Homework = {
  id: number
  lessonId: number
  title: string
  instructions: string // optional general text; can be empty
  questions: Question[]
}

export type StudentStatus = 'pending' | 'active' | 'inactive'

export type Student = {
  id: number
  name: string
  email: string
  status: StudentStatus
}

export type StudentInput = Pick<Student, 'name' | 'email'>

export type Payment = {
  studentId: number
  month: string
  note: string | null
}

// What the student pages display: a HomeworkAssignment joined with its Homework
export type Assignment = {
  id: number
  lessonId: number
  title: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  grade?: number
}

// Per-student records
export type LessonAssignment = {
  id: number
  lessonId: number
  studentId: number
  assignedAt: string
}

export type HomeworkAssignment = {
  id: number
  homeworkId: number
  studentId: number
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
}

export type Submission = {
  id: number
  homeworkAssignmentId: number
  answers: Record<number, Answer> // keyed by question id
  submittedAt: string
  grade?: number
  feedback?: string
}

export type LessonInput = Omit<Lesson, 'id'>

export type HomeworkInput = Omit<Homework, 'id'>

// Homework as one student sees it: the assignment + the homework + their answer
export type HomeworkDetail = {
  id: number // the homework assignment id
  lessonId: number
  title: string
  instructions: string
  questions: Question[]
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  answers?: Record<number, Answer>
  submittedAt?: string
  grade?: number
  feedback?: string
}

// One submitted answer, as the teacher sees it
export type SubmissionRow = HomeworkDetail & { studentId: number }

export type Question =
  | {
      id: number
      type: 'multiple_choice'
      prompt: string
      options: string[]
      correct: number[] // indexes of the correct options
      multiple: boolean // true = more than one correct answer allowed
    }
  | { id: number; type: 'open_text'; prompt: string }
  | { id: number; type: 'fill_blanks'; text: string; answers: string[] } // text contains ___ blanks

export type Answer =
  | { type: 'multiple_choice'; selected: number[] }
  | { type: 'open_text'; text: string }
  | { type: 'fill_blanks'; values: string[] }


export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green'

export type Note = {
  id: number
  studentId: number
  text: string
  color: NoteColor
  pinned: boolean
  dismissed: boolean
  createdAt: string
}

export type NoteInput = Pick<Note, 'studentId' | 'text' | 'color' | 'pinned'>