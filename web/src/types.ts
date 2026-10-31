export type Role = 'student' | 'teacher'

export type User = { 
  id: number
  name: string 
  email: string 
  role: Role
  status: StudentStatus
  mustChangePassword: boolean
  placementRequired: boolean
}

export type PlacementQuestion = {
  id: number
  type: 'multiple_choice'
  part: number // 1, 2 or 3 (the levels are not shown to students)
  passage?: string // reading text shared by a group of questions
  prompt: string
  options: string[]
  multiple: boolean
  correct: number[] // always empty for students
}

export type PlacementState = {
  state: 'not_available' | 'not_started' | 'running' | 'expired' | 'submitted'
  required: boolean
  questionCount: number
  timeLimitMinutes?: number
  endsAt?: string
  serverNow: string
  schedulingMessage?: string
  writtenLevel?: string
  possiblyAboveB1?: boolean
  questions: PlacementQuestion[]
}

export type Mark = 'Pre-A1' | 'A1' | 'A2' | 'B1'
export type FinalLevel = Mark | 'Above B1'
export type CriterionKey = 'comprehension' | 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation'
export type InterviewScores = Record<CriterionKey, Mark>

export type PlacementBlock = { level: string; correct: number; total: number; passed: boolean }

export type PlacementOverviewRow = {
  studentId: number
  name: string
  email: string
  status: StudentStatus
  needsTest: boolean
  testState: 'not_taken' | 'in_progress' | 'submitted'
  expired: boolean
  submittedAt?: string
  writtenLevel?: string
  possiblyAboveB1?: boolean
  oralLevel?: string
  finalLevel?: string
  interviewedOn?: string
}

export type PlacementReviewQuestion = {
  id: number
  number: number
  level: string
  prompt: string
  options: string[]
  correct: number
  chosen?: number
}

export type PlacementDetail = {
  student: { id: number; name: string; email: string; status: StudentStatus; needsTest: boolean }
  attempt?: {
    startedAt: string
    submittedAt?: string
    expired: boolean
    writtenLevel?: string
    possiblyAboveB1?: boolean
    blocks?: PlacementBlock[]
  }
  review: PlacementReviewQuestion[]
  interview?: {
    interviewedOn: string
    scores: InterviewScores
    oralLevel: string
    finalLevel: string
    notes: string
  }
}

export type PlacementSettings = { timeLimitMinutes: number; schedulingMessage: string }

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
  instructions: string
  questions: Question[]
  timeLimitMinutes: number | null // null = no time limit
  locked: boolean // true once any student has started or sent it: questions and time limit can't change
}

export type StudentStatus = 'pending' | 'active' | 'inactive'

export type Student = {
  id: number
  name: string
  email: string
  status: StudentStatus
  resetRequested: boolean
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
  timeLimitMinutes?: number
  expired: boolean
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
  startedAt?: string
  expired: boolean // timed, started, never sent, and the time ran out
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

export type HomeworkInput = Omit<Homework, 'id' | 'locked'>

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
  timer?: HomeworkTimer
}

export type HomeworkTimer = {
  limitMinutes: number
  state: 'not_started' | 'running' | 'expired' | 'finished'
  endsAt?: string
  serverNow: string
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

export type AppNotification = {
  id: number
  type: string
  title: string
  body: string
  link?: string
  createdAt: string
  read: boolean
}

export type NotificationsResponse = {
  unreadCount: number
  items: AppNotification[]
}