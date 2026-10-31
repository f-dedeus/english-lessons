import { and, asc, eq, ne, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import {
  appSettings,
  placementAttempts,
  placementInterviews,
  placementQuestions,
  users,
} from '../db/schema/index.ts'
import { endsAtOf, GRACE_MS } from '../homework/timer.ts'
import { computeOralLevel, FINAL_LEVELS, MARKS } from '../placement/interview.ts'
import { getPlacementSettings } from '../settings.ts'
import { notifyUser } from '../notifications.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })
const mark = z.enum(MARKS)
const finalLevel = z.enum(FINAL_LEVELS)
const scores = z.object({
  comprehension: mark,
  fluency: mark,
  grammar: mark,
  vocabulary: mark,
  pronunciation: mark,
})
const status = z.enum(['pending', 'active', 'inactive'])

const overviewRow = z.object({
  studentId: z.number(),
  name: z.string(),
  email: z.string(),
  status,
  needsTest: z.boolean(),
  testState: z.enum(['not_taken', 'in_progress', 'submitted']),
  expired: z.boolean(),
  submittedAt: z.string().optional(),
  writtenLevel: z.string().optional(),
  possiblyAboveB1: z.boolean().optional(),
  oralLevel: z.string().optional(),
  finalLevel: z.string().optional(),
  interviewedOn: z.string().optional(),
})

const detailSchema = z.object({
  student: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    status,
    needsTest: z.boolean(),
  }),
  attempt: z
    .object({
      startedAt: z.string(),
      submittedAt: z.string().optional(),
      expired: z.boolean(),
      writtenLevel: z.string().optional(),
      possiblyAboveB1: z.boolean().optional(),
      blocks: z
        .array(z.object({ level: z.string(), correct: z.number(), total: z.number(), passed: z.boolean() }))
        .optional(),
    })
    .optional(),
  // The questions with the right answer and what the student chose (only once the test is finished)
  review: z.array(
    z.object({
      id: z.number(),
      number: z.number(),
      level: z.string(),
      prompt: z.string(),
      options: z.array(z.string()),
      correct: z.number(),
      chosen: z.number().optional(),
    }),
  ),
  interview: z
    .object({
      interviewedOn: z.string(),
      scores,
      oralLevel: z.string(),
      finalLevel: z.string(),
      notes: z.string(),
    })
    .optional(),
})

// Started, not finished, and past the time limit (plus the grace)
function isAttemptExpired(
  attempt: { startedAt: Date; submittedAt: Date | null } | undefined,
  limitMinutes: number | null,
) {
  if (!attempt || attempt.submittedAt || limitMinutes === null) return false
  return Date.now() > endsAtOf(attempt.startedAt, limitMinutes).getTime() + GRACE_MS
}

export const placementRoutes: FastifyPluginAsyncZod = async (app) => {
  // Teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  // Every student who is not inactive, with where they are in the test and the interview
  app.get('/placement/overview', { schema: { response: { 200: z.array(overviewRow) } } }, async () => {
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        needsTest: users.needsPlacementTest,
      })
      .from(users)
      .where(and(eq(users.role, 'student'), ne(users.status, 'inactive')))
      .orderBy(asc(users.name))

    const attempts = new Map((await db.select().from(placementAttempts)).map((a) => [a.studentId, a]))
    const interviews = new Map((await db.select().from(placementInterviews)).map((i) => [i.studentId, i]))
    const { timeLimitMinutes } = await getPlacementSettings()

    return students.map((s) => {
      const attempt = attempts.get(s.id)
      const interview = interviews.get(s.id)
      return {
        studentId: s.id,
        name: s.name,
        email: s.email,
        status: s.status,
        needsTest: s.needsTest,
        testState: attempt?.submittedAt ? ('submitted' as const) : attempt ? ('in_progress' as const) : ('not_taken' as const),
        expired: isAttemptExpired(attempt, timeLimitMinutes),
        submittedAt: attempt?.submittedAt?.toISOString(),
        writtenLevel: attempt?.writtenLevel ?? undefined,
        possiblyAboveB1: attempt?.result?.possiblyAboveB1,
        oralLevel: interview?.oralLevel,
        finalLevel: interview?.finalLevel,
        interviewedOn: interview?.interviewedOn,
      }
    })
  })

  app.get(
    '/placement/students/:id',
    { schema: { params: idParams, response: { 200: detailSchema } } },
    async (request) => {
      const studentId = request.params.id

      const [student] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          status: users.status,
          needsTest: users.needsPlacementTest,
        })
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      if (!student) throw app.httpErrors.notFound('Student not found.')

      const [attempt] = await db
        .select()
        .from(placementAttempts)
        .where(eq(placementAttempts.studentId, studentId))
      const [interview] = await db
        .select()
        .from(placementInterviews)
        .where(eq(placementInterviews.studentId, studentId))
      const { timeLimitMinutes } = await getPlacementSettings()

      let review: z.infer<typeof detailSchema>['review'] = []
      if (attempt?.submittedAt) {
        const questions = await db.select().from(placementQuestions).orderBy(asc(placementQuestions.position))
        review = questions.flatMap((q) => {
          if (q.content.type !== 'multiple_choice') return []
          const answer = attempt.answers?.[String(q.id)]
          return [
            {
              id: q.id,
              number: q.position + 1,
              level: q.level,
              prompt: q.content.prompt,
              options: q.content.options,
              correct: q.content.correct[0] ?? 0,
              chosen: answer?.type === 'multiple_choice' ? answer.selected[0] : undefined,
            },
          ]
        })
      }

      return {
        student,
        attempt: attempt
          ? {
              startedAt: attempt.startedAt.toISOString(),
              submittedAt: attempt.submittedAt?.toISOString(),
              expired: isAttemptExpired(attempt, timeLimitMinutes),
              writtenLevel: attempt.writtenLevel ?? undefined,
              possiblyAboveB1: attempt.result?.possiblyAboveB1,
              blocks: attempt.result?.blocks,
            }
          : undefined,
        review,
        interview: interview
          ? {
              interviewedOn: interview.interviewedOn,
              scores: interview.scores,
              oralLevel: interview.oralLevel,
              finalLevel: interview.finalLevel,
              notes: interview.notes,
            }
          : undefined,
      }
    },
  )

  // Saves the interview sheet. The oral level is worked out here from the five marks.
  app.put(
    '/placement/students/:id/interview',
    {
      schema: {
        params: idParams,
        body: z.object({
          interviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          scores,
          finalLevel,
          notes: z.string().trim().max(2000),
        }),
      },
    },
    async (request, reply) => {
      const studentId = request.params.id

      const [student] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      if (!student) throw app.httpErrors.notFound('Student not found.')

      const values = {
        interviewedOn: request.body.interviewedOn ?? new Date().toISOString().slice(0, 10),
        scores: request.body.scores,
        oralLevel: computeOralLevel(request.body.scores),
        finalLevel: request.body.finalLevel,
        notes: request.body.notes,
      }

      await db
        .insert(placementInterviews)
        .values({ studentId, ...values })
        .onConflictDoUpdate({ target: placementInterviews.studentId, set: values })

      await notifyUser(
        studentId,
        {
          type: 'level_recorded',
          title: 'Your level is ready',
          body: `Your level: ${request.body.finalLevel}`,
          link: '/',
        },
        { dedupe: true },
      )  
      return reply.code(204).send()
    },
  )

  // Another attempt: deletes the test attempt (the interview is kept) and asks for the test again
  app.post('/placement/students/:id/retake', { schema: { params: idParams } }, async (request, reply) => {
    const studentId = request.params.id

    await db.transaction(async (tx) => {
      const [student] = await tx
        .update(users)
        .set({ needsPlacementTest: true })
        .where(and(eq(users.id, studentId), eq(users.role, 'student')))
        .returning({ id: users.id })
      if (!student) throw app.httpErrors.notFound('Student not found.')

      await tx.delete(placementAttempts).where(eq(placementAttempts.studentId, studentId))
    })

    return reply.code(204).send()
  })

  // Ask a student to take the test (for students the teacher added by hand)
  app.put(
    '/placement/students/:id/required',
    { schema: { params: idParams, body: z.object({ required: z.boolean() }) } },
    async (request, reply) => {
      const [student] = await db
        .update(users)
        .set({ needsPlacementTest: request.body.required })
        .where(and(eq(users.id, request.params.id), eq(users.role, 'student')))
        .returning({ id: users.id })
      if (!student) throw app.httpErrors.notFound('Student not found.')
      return reply.code(204).send()
    },
  )

  // ---- Settings ----

  app.get(
    '/placement/settings',
    {
      schema: {
        response: { 200: z.object({ timeLimitMinutes: z.number(), schedulingMessage: z.string() }) },
      },
    },
    async () => {
      const settings = await getPlacementSettings()
      return { timeLimitMinutes: settings.timeLimitMinutes ?? 0, schedulingMessage: settings.schedulingMessage }
    },
  )

  // timeLimitMinutes 0 = no time limit
  app.put(
    '/placement/settings',
    {
      schema: {
        body: z.object({
          timeLimitMinutes: z.number().int().min(0).max(600),
          schedulingMessage: z.string().trim().min(1).max(2000),
        }),
      },
    },
    async (request, reply) => {
      await db
        .insert(appSettings)
        .values([
          { key: 'placement.timeLimitMinutes', value: String(request.body.timeLimitMinutes) },
          { key: 'placement.schedulingMessage', value: request.body.schedulingMessage },
        ])
        .onConflictDoUpdate({ target: appSettings.key, set: { value: sql`excluded.value` } })
      return reply.code(204).send()
    },
  )
}