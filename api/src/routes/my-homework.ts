import { and, asc, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { fetchDetails, hideAnswers } from '../db/homework-queries.ts'
import { homeworkAssignments, homeworkQuestions, submissions } from '../db/schema/index.ts'
import { checkAnswers, normalizeAnswers } from '../homework/questions.ts'
import { answerSchema, detailSchema } from './homework-schemas.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })

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
      const revealAnswers = detail.status === 'graded'
      return {
        ...detail,
        questions: revealAnswers ? detail.questions : detail.questions.map(hideAnswers),
      }
    },
  )

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
        const [assignment] = await tx
          .select()
          .from(homeworkAssignments)
          .where(
            and(
              eq(homeworkAssignments.id, request.params.id),
              eq(homeworkAssignments.studentId, request.user.id),
            ),
          )
        if (!assignment) throw app.httpErrors.notFound('Homework not found.')

        if (assignment.status === 'graded') {
          throw app.httpErrors.conflict('This homework was already graded and can no longer be changed.')
        }

        const questionRows = await tx
          .select()
          .from(homeworkQuestions)
          .where(eq(homeworkQuestions.homeworkId, assignment.homeworkId))
          .orderBy(asc(homeworkQuestions.position), asc(homeworkQuestions.id))
        const questions = questionRows.map((q) => ({ id: q.id, content: q.content }))

        const problem = checkAnswers(questions, request.body.answers)
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