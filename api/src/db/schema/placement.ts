import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { id } from './helpers.ts'
import type { PlacementResult, QuestionContent, SubmissionAnswers } from './json-types.ts'
import { users } from './users.ts'

// The questions of the placement test, in order
export const placementQuestions = pgTable(
  'placement_questions',
  {
    id: id(),
    position: integer().notNull(),
    level: text().notNull(), // 'A1' | 'A2' | 'B1'
    content: jsonb().$type<QuestionContent>().notNull(),
  },
  (t) => [uniqueIndex('placement_questions_position_unique').on(t.position)],
)

// One attempt per student (the teacher can delete it to allow another)
export const placementAttempts = pgTable(
  'placement_attempts',
  {
    id: id(),
    studentId: integer()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp({ withTimezone: true }),
    answers: jsonb().$type<SubmissionAnswers>(),
    result: jsonb().$type<PlacementResult>(),
    writtenLevel: text(),
  },
  (t) => [index('placement_attempts_level_idx').on(t.writtenLevel)],
)

// Small teacher-editable settings: the timer and the scheduling message
export const appSettings = pgTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
})