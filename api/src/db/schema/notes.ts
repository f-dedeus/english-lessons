import { boolean, check, index, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { noteColor } from './enums.ts'
import { createdAt, id } from './helpers.ts'
import { users } from './users.ts'

export const notes = pgTable(
  'notes',
  {
    id: id(),
    studentId: integer()
      .notNull()
      .references(() => users.id),
    createdBy: integer()
      .notNull()
      .references(() => users.id),
    text: text().notNull(),
    color: noteColor().notNull().default('yellow'),
    pinned: boolean().notNull().default(false),
    dismissed: boolean().notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index('notes_student_idx').on(t.studentId),
    check('notes_text_length', sql`char_length(${t.text}) between 1 and 280`),
  ],
)