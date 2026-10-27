import { and, asc, eq, isNull } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { fetchDetails, hideAnswers } from '../db/homework-queries.ts'
import { homework, homeworkAssignments, homeworkQuestions, submissions } from '../db/schema/index.ts'
import { checkAnswers, normalizeAnswers } from '../homework/questions.ts'
import { endsAtOf, GRACE_MS, isExpired } from '../homework/timer.ts'
import { answerSchema, detailSchema } from './homework-schemas.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })

type TimerState = 'not_started' | 'running' | 'expired' | 'finished'

export const myHomeworkRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('student'))

  // The list the dashboard and the Homework page show
  app.get(
    '/me/homework',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              lessonId: z.number(),
              title: z.string(),
              dueDate: z.string(),
              status: z.enum(['pending', 'submitted', 'graded']),
              grade: z.number().optional(),
              timeLimitMinutes: z.number().optional(),
              expired: z.boolean(),
            }),
          ),
        },
      },
    },
    async (request) => {
      const details = await fetchDetails(eq(homeworkAssignments.studentId, request.user.id))
      return details.map((d) => ({
        id: d.id,
        lessonId: d.lessonId,
        title: d.title,
        dueDate: d.dueDate,
        status: d.status,
        grade: d.grade,
        timeLimitMinutes: d.timeLimitMinutes ?? undefined,
        expired: isExpired({
          limitMinutes: d.timeLimitMinutes,
          startedAt: d.startedAt,
          status: d.status,
        }),
      }))
    },
  )

  app.get(
    '/me/homework/:id',
    { schema: { params: idParams, response: { 200: detailSchema } } },
    async (request) => {
      const [detail] = await fetchDetails(
        and(
          eq(homeworkAssignments.id, request.params.id),
          eq(homeworkAssignments.studentId, request.user.id),
        )!,
      )
      // Same answer for "doesn't exist" and "belongs to someone else"
      if (!detail) throw app.httpErrors.notFound('Homework not found.')

      // The answer key is only revealed once the homework is graded
      let questions =
        detail.status === 'graded' ? detail.questions : detail.questions.map(hideAnswers)
      let instructions = detail.instructions
      let timer:
        | { limitMinutes: number; state: TimerState; endsAt?: string; serverNow: string }
        | undefined

      if (detail.timeLimitMinutes !== null) {
        const now = new Date()
        const endsAt = detail.startedAt ? endsAtOf(detail.startedAt, detail.timeLimitMinutes) : null
        const expired = isExpired(
          { limitMinutes: detail.timeLimitMinutes, startedAt: detail.startedAt, status: detail.status },
          now,
        )

        let state: TimerState
        if (detail.status !== 'pending') state = 'finished'
        else if (endsAt === null) state = 'not_started'
        else if (expired) state = 'expired'
        else state = 'running'

        // Nothing to read before starting, or after the time ran out
        if (state === 'not_started' || state === 'expired') {
          questions = []
          instructions = ''
        }

        timer = {
          limitMinutes: detail.timeLimitMinutes,
          state,
          endsAt: endsAt?.toISOString(),
          serverNow: now.toISOString(),
        }
      }

      return { ...detail, instructions, questions, timer }
    },
  )

  // Starts the clock of a timed homework (does nothing if it was already started)
  app.post('/me/homework/:id/start', { schema: { params: idParams } }, async (request, reply) => {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ assignment: homeworkAssignments, limit: homework.timeLimitMinutes })
        .from(homeworkAssignments)
        .innerJoin(homework, eq(homeworkAssignments.homeworkId, homework.id))
        .where(
          and(
            eq(homeworkAssignments.id, request.params.id),
            eq(homeworkAssignments.studentId, request.user.id),
          ),
        )
      if (!row) throw app.httpErrors.notFound('Homework not found.')
      if (row.limit === null) throw app.httpErrors.badRequest('This homework has no time limit.')
      if (row.assignment.status !== 'pending') {
        throw app.httpErrors.conflict('This homework was already sent.')
      }

      // Only the first click starts the clock
      await tx
        .update(homeworkAssignments)
        .set({ startedAt: new Date() })
        .where(and(eq(homeworkAssignments.id, row.assignment.id), isNull(homeworkAssignments.startedAt)))
    })

    return reply.code(204).send()
  })

  // Send (or update) the answers, until the teacher grades them
  app.post(
    '/me/homework/:id/submit',
    {
      schema: {
        params: idParams,
        body: z.object({ answers: z.record(z.string(), answerSchema) }),
      },
    },
    async (request, reply) => {
      await db.transaction(async (tx) => {
        const [row] = await tx
          .select({ assignment: homeworkAssignments, limit: homework.timeLimitMinutes })
          .from(homeworkAssignments)
          .innerJoin(homework, eq(homeworkAssignments.homeworkId, homework.id))
          .where(
            and(
              eq(homeworkAssignments.id, request.params.id),
              eq(homeworkAssignments.studentId, request.user.id),
            ),
          )
        if (!row) throw app.httpErrors.notFound('Homework not found.')
        const { assignment, limit } = row

        if (assignment.status === 'graded') {
          throw app.httpErrors.conflict('This homework was already graded and can no longer be changed.')
        }

        // Timed homework: started, one attempt, and within the time
        if (limit !== null) {
          if (!assignment.startedAt) {
            throw app.httpErrors.conflict('Start the homework before sending your answers.')
          }
          if (assignment.status !== 'pending') {
            throw app.httpErrors.conflict('You already sent your answers for this timed homework.')
          }
          const deadline = endsAtOf(assignment.startedAt, limit).getTime() + GRACE_MS
          if (Date.now() > deadline) {
            throw app.httpErrors.conflict(
              'Time is up, so this homework can no longer be sent. Ask your teacher for another attempt.',
            )
          }
        }

        const questionRows = await tx
          .select()
          .from(homeworkQuestions)
          .where(eq(homeworkQuestions.homeworkId, assignment.homeworkId))
          .orderBy(asc(homeworkQuestions.position), asc(homeworkQuestions.id))
        const questions = questionRows.map((q) => ({ id: q.id, content: q.content }))

        // When time runs out the answers can be incomplete
        const problem = checkAnswers(questions, request.body.answers, { allowIncomplete: limit !== null })
        if (problem) throw app.httpErrors.badRequest(problem)

        const answers = normalizeAnswers(questions, request.body.answers)

        await tx
          .insert(submissions)
          .values({ homeworkAssignmentId: assignment.id, answers })
          .onConflictDoUpdate({
            target: submissions.homeworkAssignmentId,
            set: { answers, submittedAt: new Date() },
          })

        await tx
          .update(homeworkAssignments)
          .set({ status: 'submitted' })
          .where(eq(homeworkAssignments.id, assignment.id))
      })

      return reply.code(204).send()
    },
  )
}