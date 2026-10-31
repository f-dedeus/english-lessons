import { and, asc, eq, isNull } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { placementAttempts,placementInterviews, placementQuestions, users } from '../db/schema/index.ts'
import { checkAnswers, normalizeAnswers } from '../homework/questions.ts'
import { endsAtOf, GRACE_MS } from '../homework/timer.ts'
import { LEVELS, scorePlacement } from '../placement/scoring.ts'
import { getPlacementSettings } from '../settings.ts'
import { answerSchema } from './homework-schemas.ts'
import { notifyTeachers } from '../notifications.ts'

// What the student receives: no answer key, and no level (just "part 1, 2, 3")
const studentQuestion = z.object({
  id: z.number(),
  type: z.literal('multiple_choice'),
  part: z.number(),
  passage: z.string().optional(),
  prompt: z.string(),
  options: z.array(z.string()),
  multiple: z.boolean(),
  correct: z.array(z.number()), // always empty here, so the front-end types stay the same
})

type QuestionRow = typeof placementQuestions.$inferSelect

function toStudentQuestion(row: QuestionRow) {
  if (row.content.type !== 'multiple_choice') return []
  return [
    {
      id: row.id,
      type: 'multiple_choice' as const,
      part: LEVELS.findIndex((level) => level === row.level) + 1,
      passage: row.content.passage,
      prompt: row.content.prompt,
      options: row.content.options,
      multiple: row.content.multiple,
      correct: [],
    },
  ]
}

async function loadContext(studentId: number) {
  const [student] = await db
    .select({ needsPlacementTest: users.needsPlacementTest })
    .from(users)
    .where(eq(users.id, studentId))
  const questions = await db.select().from(placementQuestions).orderBy(asc(placementQuestions.position))
  const [attempt] = await db
    .select()
    .from(placementAttempts)
    .where(eq(placementAttempts.studentId, studentId))
  const settings = await getPlacementSettings()

  return { needsTest: student?.needsPlacementTest ?? false, questions, attempt, settings }
}

type State = 'not_available' | 'not_started' | 'running' | 'expired' | 'submitted'

export const myPlacementRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('student'))

  // Where the student is in the test. Questions are only sent while the test is running.
  app.get(
    '/me/placement',
    {
      config: { allowPending: true },
      schema: {
        response: {
          200: z.object({
            state: z.enum(['not_available', 'not_started', 'running', 'expired', 'submitted']),
            required: z.boolean(),
            questionCount: z.number(),
            timeLimitMinutes: z.number().optional(),
            endsAt: z.string().optional(),
            serverNow: z.string(),
            schedulingMessage: z.string().optional(),
            // The result of the written part, only after the student has finished
            writtenLevel: z.string().optional(),
            possiblyAboveB1: z.boolean().optional(),
            questions: z.array(studentQuestion),
          }),
        },
      },
    },
    async (request) => {
      const { needsTest, questions, attempt, settings } = await loadContext(request.user.id)
      const now = new Date()
      const limit = settings.timeLimitMinutes
      const endsAt = attempt && limit !== null ? endsAtOf(attempt.startedAt, limit) : null

      let state: State
      if (questions.length === 0 || (!needsTest && !attempt)) state = 'not_available'
      else if (attempt?.submittedAt) state = 'submitted'
      else if (!attempt) state = 'not_started'
      else if (endsAt && now.getTime() > endsAt.getTime() + GRACE_MS) state = 'expired'
      else state = 'running'

      const finished = state === 'submitted'

      return {
        state,
        required: state === 'not_started' || state === 'running' || state === 'expired',
        questionCount: questions.length,
        timeLimitMinutes: limit ?? undefined,
        endsAt: state === 'running' ? endsAt?.toISOString() : undefined,
        serverNow: now.toISOString(),
        schedulingMessage: finished ? settings.schedulingMessage : undefined,
        writtenLevel: finished ? (attempt?.writtenLevel ?? undefined) : undefined,
        possiblyAboveB1: finished ? attempt?.result?.possiblyAboveB1 : undefined,
        questions: state === 'running' ? questions.flatMap(toStudentQuestion) : [],
      }
    },
  )

  // Starts the clock (does nothing if it already started)
  app.post('/me/placement/start', { config: { allowPending: true } }, async (request, reply) => {
    const { needsTest, questions, attempt } = await loadContext(request.user.id)

    if (questions.length === 0 || !needsTest) {
      throw app.httpErrors.conflict('There is no placement test for you to take.')
    }
    if (attempt?.submittedAt) throw app.httpErrors.conflict('You already finished the test.')

    await db.insert(placementAttempts).values({ studentId: request.user.id }).onConflictDoNothing()
    return reply.code(204).send()
  })

  // Blank answers are allowed: "if you don't know, leave it blank"
  app.post(
    '/me/placement/submit',
    {
      config: { allowPending: true },
      schema: { body: z.object({ answers: z.record(z.string(), answerSchema) }) },
    },
    async (request, reply) => {
      const { questions, attempt, settings } = await loadContext(request.user.id)

      if (!attempt) throw app.httpErrors.conflict('Start the test before sending your answers.')
      if (attempt.submittedAt) throw app.httpErrors.conflict('You already finished the test.')

      const limit = settings.timeLimitMinutes
      if (limit !== null && Date.now() > endsAtOf(attempt.startedAt, limit).getTime() + GRACE_MS) {
        throw app.httpErrors.conflict(
          'Time is up, so the test can no longer be sent. Ask your teacher for another attempt.',
        )
      }

      const stored = questions.map((q) => ({ id: q.id, content: q.content }))
      const problem = checkAnswers(stored, request.body.answers, { allowIncomplete: true })
      if (problem) throw app.httpErrors.badRequest(problem)

      const answers = normalizeAnswers(stored, request.body.answers)
      const result = scorePlacement(
        questions.map((q) => ({ id: q.id, level: q.level, content: q.content })),
        answers,
      )

      await db
        .update(placementAttempts)
        .set({ submittedAt: new Date(), answers, result, writtenLevel: result.writtenLevel })
        .where(and(eq(placementAttempts.id, attempt.id), isNull(placementAttempts.submittedAt)))
        
      const [student] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, request.user.id))
      await notifyTeachers({
        type: 'placement_done',
        title: 'Placement test finished',
        body: `${student?.name ?? 'A student'} finished the written test: ${result.writtenLevel}.`,
        link: `/admin/placement/${request.user.id}`,
      })
      return reply.code(204).send()
    },
  )
    // The final level, once the teacher has recorded it after the interview
  app.get(
    '/me/level',
    { schema: { response: { 200: z.object({ finalLevel: z.string().optional() }) } } },
    async (request) => {
      const [row] = await db
        .select({ finalLevel: placementInterviews.finalLevel })
        .from(placementInterviews)
        .where(eq(placementInterviews.studentId, request.user.id))
      return { finalLevel: row?.finalLevel }
    },
  )
}