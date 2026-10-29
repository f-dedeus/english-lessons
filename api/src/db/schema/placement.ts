import { date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { id } from './helpers.ts'
import type {
  InterviewScores,
  PlacementResult,
  QuestionContent,
  SubmissionAnswers,
} from './json-types.ts'
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

// The teacher's interview sheet (one per student)
export const placementInterviews = pgTable('placement_interviews', {
  id: id(),
  studentId: integer()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  interviewedOn: date({ mode: 'string' }).notNull(),
  scores: jsonb().$type<InterviewScores>().notNull(),
  oralLevel: text().notNull(),
  finalLevel: text().notNull(),
  notes: text().notNull().default(''),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// Small teacher-editable settings: the timer and the scheduling message
export const appSettings = pgTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
})