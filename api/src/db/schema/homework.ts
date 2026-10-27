import { check, date, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { homeworkStatus } from './enums.ts'
import { createdAt, id } from './helpers.ts'
import type { QuestionContent, SubmissionAnswers } from './json-types.ts'
import { lessons } from './lessons.ts'
import { users } from './users.ts'

export const homework = pgTable(
  'homework',
  {
    id: id(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    title: text().notNull(),
    instructions: text().notNull().default(''),
    // Minutes a student has once they start; null = no time limit
    timeLimitMinutes: integer(),
    createdAt: createdAt(),
  },
  (t) => [
    index('homework_lesson_idx').on(t.lessonId),
    check('homework_time_limit_range', sql`${t.timeLimitMinutes} is null or ${t.timeLimitMinutes} between 1 and 600`),
  ],
)

export const homeworkQuestions = pgTable(
  'homework_questions',
  {
    id: id(),
    homeworkId: integer()
      .notNull()
      .references(() => homework.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    content: jsonb().$type<QuestionContent>().notNull(),
  },
  (t) => [index('homework_questions_homework_idx').on(t.homeworkId)],
)

export const homeworkAssignments = pgTable(
  'homework_assignments',
  {
    id: id(),
    homeworkId: integer()
      .notNull()
      .references(() => homework.id, { onDelete: 'cascade' }),
    studentId: integer()
      .notNull()
      .references(() => users.id),
    dueDate: date({ mode: 'string' }).notNull(),
    status: homeworkStatus().notNull().default('pending'),
    startedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('homework_assignments_unique').on(t.homeworkId, t.studentId),
    index('homework_assignments_student_idx').on(t.studentId),
  ],
)

export const submissions = pgTable(
  'submissions',
  {
    id: id(),
    homeworkAssignmentId: integer()
      .notNull()
      .unique()
      .references(() => homeworkAssignments.id, { onDelete: 'cascade' }),
    answers: jsonb().$type<SubmissionAnswers>().notNull(),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    grade: real(),
    feedback: text(),
    gradedAt: timestamp({ withTimezone: true }),
  },
  (t) => [check('submissions_grade_range', sql`${t.grade} is null or (${t.grade} >= 0 and ${t.grade} <= 10)`)],
)