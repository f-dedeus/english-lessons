import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { lessonStatus, materialType } from './enums.ts'
import { createdAt, id } from './helpers.ts'
import { users } from './users.ts'

export const lessons = pgTable('lessons', {
  id: id(),
  title: text().notNull(),
  description: text().notNull().default(''),
  status: lessonStatus().notNull().default('draft'),
  createdBy: integer()
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const lessonMaterials = pgTable(
  'lesson_materials',
  {
    id: id(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    type: materialType().notNull(),
    title: text().notNull(),
    url: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [index('lesson_materials_lesson_idx').on(t.lessonId)],
)

export const lessonAssignments = pgTable(
  'lesson_assignments',
  {
    id: id(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    studentId: integer()
      .notNull()
      .references(() => users.id),
    assignedAt: createdAt(),
  },
  (t) => [
    uniqueIndex('lesson_assignments_unique').on(t.lessonId, t.studentId),
    index('lesson_assignments_student_idx').on(t.studentId),
  ],
)