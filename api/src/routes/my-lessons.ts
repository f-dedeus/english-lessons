import { and, eq, inArray } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { fetchLessons } from '../db/lesson-queries.ts'
import { lessonAssignments, lessons } from '../db/schema/index.ts'
import { lessonSchema } from './lesson-schemas.ts'

export const myLessonRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('student'))

  // Published lessons that were assigned to this student. Nothing else is ever visible.
  const visibleTo = (studentId: number) =>
    and(
      eq(lessons.status, 'published'),
      inArray(
        lessons.id,
        db
          .select({ id: lessonAssignments.lessonId })
          .from(lessonAssignments)
          .where(eq(lessonAssignments.studentId, studentId)),
      ),
    )

  app.get('/me/lessons', { schema: { response: { 200: z.array(lessonSchema) } } }, async (request) =>
    fetchLessons(visibleTo(request.user.id)),
  )

  app.get(
    '/me/lessons/:id',
    {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
        response: { 200: lessonSchema },
      },
    },
    async (request) => {
      const [lesson] = await fetchLessons(
        and(eq(lessons.id, request.params.id), visibleTo(request.user.id)),
      )
      // Same answer for "doesn't exist" and "not yours"
      if (!lesson) throw app.httpErrors.notFound('Lesson not found.')
      return lesson
    },
  )
}