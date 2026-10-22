import { eq, isNotNull } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { fetchDetails } from '../db/homework-queries.ts'
import { homeworkAssignments, submissions } from '../db/schema/index.ts'
import { submissionRowSchema } from './homework-schemas.ts'

export const submissionRoutes: FastifyPluginAsyncZod = async (app) => {
  // Teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  // Every answer students have sent, newest first
  app.get(
    '/submissions',
    { schema: { response: { 200: z.array(submissionRowSchema) } } },
    async () => {
      const rows = await fetchDetails(isNotNull(submissions.id))
      return rows.sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
    },
  )

  // :id is the homework assignment id. The teacher can also re-grade.
  app.put(
    '/submissions/:id/grade',
    {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: z.object({
          grade: z.number().min(0).max(10),
          feedback: z.string().trim().max(2000),
        }),
      },
    },
    async (request, reply) => {
      const assignmentId = request.params.id
      const { grade, feedback } = request.body

      await db.transaction(async (tx) => {
        const [submission] = await tx
          .select({ id: submissions.id })
          .from(submissions)
          .where(eq(submissions.homeworkAssignmentId, assignmentId))
        if (!submission) throw app.httpErrors.notFound('Submission not found.')

        await tx
          .update(submissions)
          .set({ grade, feedback: feedback || null, gradedAt: new Date() })
          .where(eq(submissions.id, submission.id))

        await tx
          .update(homeworkAssignments)
          .set({ status: 'graded' })
          .where(eq(homeworkAssignments.id, assignmentId))
      })

      return reply.code(204).send()
    },
  )
}