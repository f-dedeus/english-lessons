import { pgEnum } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['teacher', 'student'])
export const userStatus = pgEnum('user_status', ['pending', 'active', 'inactive'])
export const lessonStatus = pgEnum('lesson_status', ['draft', 'published'])
export const materialType = pgEnum('material_type', ['video', 'pdf', 'audio'])
export const noteColor = pgEnum('note_color', ['yellow', 'pink', 'blue', 'green'])
export const homeworkStatus = pgEnum('homework_status', ['pending', 'submitted', 'graded'])