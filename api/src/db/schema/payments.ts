import { check, date, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createdAt, id } from './helpers.ts'
import { users } from './users.ts'

// A row exists = that student paid that month
export const payments = pgTable(
  'payments',
  {
    id: id(),
    studentId: integer()
      .notNull()
      .references(() => users.id),
    month: date({ mode: 'string' }).notNull(), // always the first day: 2026-10-01
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('payments_student_month_unique').on(t.studentId, t.month),
    check('payments_month_is_first_day', sql`extract(day from ${t.month}) = 1`),
  ],
)