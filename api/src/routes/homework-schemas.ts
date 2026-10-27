import { z } from 'zod'
import { checkQuestion } from '../homework/questions.ts'

const text = z.string().trim().min(1).max(1000)

// What the teacher sends for one question (ids are ignored: the database assigns them)
export const questionInput = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('multiple_choice'),
      prompt: text,
      options: z.array(z.string().trim().min(1).max(300)).min(2).max(10),
      correct: z.array(z.number().int().min(0)).min(1).max(10),
      multiple: z.boolean(),
    }),
    z.object({ type: z.literal('open_text'), prompt: text }),
    z.object({
      type: z.literal('fill_blanks'),
      text,
      answers: z.array(z.string().trim().min(1).max(200)).min(1).max(30),
    }),
  ])
  .superRefine((question, ctx) => {
    const problem = checkQuestion(question)
    if (problem) ctx.addIssue({ code: 'custom', message: problem })
  })

// What the student sends for one question
export const answerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('multiple_choice'), selected: z.array(z.number().int().min(0)).max(10) }),
  z.object({ type: z.literal('open_text'), text: z.string().max(5000) }),
  z.object({ type: z.literal('fill_blanks'), values: z.array(z.string().max(200)).max(30) }),
])

// What the API returns
const questionOut = z.discriminatedUnion('type', [
  z.object({
    id: z.number(),
    type: z.literal('multiple_choice'),
    prompt: z.string(),
    options: z.array(z.string()),
    correct: z.array(z.number()),
    multiple: z.boolean(),
  }),
  z.object({ id: z.number(), type: z.literal('open_text'), prompt: z.string() }),
  z.object({
    id: z.number(),
    type: z.literal('fill_blanks'),
    text: z.string(),
    answers: z.array(z.string()),
  }),
])

const status = z.enum(['pending', 'submitted', 'graded'])

export const homeworkSchema = z.object({
  id: z.number(),
  lessonId: z.number(),
  title: z.string(),
  instructions: z.string(),
  timeLimitMinutes: z.number().nullable(),
  locked: z.boolean(), // true once any student has started or sent it
  questions: z.array(questionOut),
})

export const detailSchema = z.object({
  id: z.number(), // the homework assignment id
  lessonId: z.number(),
  title: z.string(),
  instructions: z.string(),
  questions: z.array(questionOut),
  dueDate: z.string(),
  status,
  answers: z.record(z.string(), answerSchema).optional(),
  submittedAt: z.string().optional(),
  grade: z.number().optional(),
  feedback: z.string().optional(),
  // Only for timed homework
  timer: z
    .object({
      limitMinutes: z.number(),
      state: z.enum(['not_started', 'running', 'expired', 'finished']),
      endsAt: z.string().optional(),
      serverNow: z.string(),
    })
    .optional(),
})

export const submissionRowSchema = detailSchema.extend({ studentId: z.number() })

export const assignmentSchema = z.object({
  id: z.number(),
  homeworkId: z.number(),
  studentId: z.number(),
  dueDate: z.string(),
  status,
  startedAt: z.string().optional(),
  expired: z.boolean(),
})