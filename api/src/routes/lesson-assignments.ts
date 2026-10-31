import { and, asc, eq, inArray, notInArray } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { lessonAssignments, lessons, users } from '../db/schema/index.ts'
import { notifyUser, notifyUsers } from '../notifications.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })
const positiveInt = z.number().int().positive()

export const lessonAssignmentRoutes: FastifyPluginAsyncZod = async (app) => {
  // Teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  app.get(
    '/lesson-assignments',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              lessonId: z.number(),
              studentId: z.number(),
              assignedAt: z.string(), // 2026-10-16
            }),
          ),
        },
      },
    },
    async () => {
      const rows = await db.select().from(lessonAssignments).orderBy(asc(lessonAssignments.id))
      return rows.map((r) => ({
        id: r.id,
        lessonId: r.lessonId,
        studentId: r.studentId,
        assignedAt: r.assignedAt.toISOString().slice(0, 10),
      }))
    },
  )

  // Sets exactly which students have this lesson (used by the "Assign" panel)
  app.put(
    '/lessons/:id/students',
    {
      schema: {
        params: idParams,
        body: z.object({ studentIds: z.array(positiveInt).max(500) }),
      },
    },
    async (request, reply) => {
      const lessonId = request.params.id
      const studentIds = [...new Set(request.body.studentIds)]

      const [lesson] = await db
        .select({ status: lessons.status, title: lessons.title })
        .from(lessons)
        .where(eq(lessons.id, lessonId))
      if (!lesson) throw app.httpErrors.notFound('Lesson not found.')
      if (studentIds.length > 0 && lesson.status !== 'published') {
        throw app.httpErrors.conflict('Publish the lesson before assigning it to students.')
      }

      if (studentIds.length > 0) {
        const found = await db
          .select({ id: users.id })
          .from(users)
          .where(and(inArray(users.id, studentIds), eq(users.role, 'student')))
        if (found.length !== studentIds.length) {
          throw app.httpErrors.badRequest('One or more students do not exist.')
        }
      }

      const before = new Set(
        (
          await db
            .select({ studentId: lessonAssignments.studentId })
            .from(lessonAssignments)
            .where(eq(lessonAssignments.lessonId, lessonId))
        ).map((row) => row.studentId),
      )

      await db.transaction(async (tx) => {
        await tx
          .delete(lessonAssignments)
          .where(
            studentIds.length > 0
              ? and(
                  eq(lessonAssignments.lessonId, lessonId),
                  notInArray(lessonAssignments.studentId, studentIds),
                )
              : eq(lessonAssignments.lessonId, lessonId),
          )

        if (studentIds.length > 0) {
          await tx
            .insert(lessonAssignments)
            .values(studentIds.map((studentId) => ({ lessonId, studentId })))
            .onConflictDoNothing()
        }
      })

      // Only the students who did not have this lesson before are notified
      await notifyUsers(
        studentIds.filter((studentId) => !before.has(studentId)),
        { type: 'lesson_assigned', title: 'New lesson', body: lesson.title, link: `/lessons/${lessonId}` },
      )

      return reply.code(204).send()
    },
  )

  // Assigns one lesson to one student (used from the student's page)
  app.post(
    '/lesson-assignments',
    { schema: { body: z.object({ lessonId: positiveInt, studentId: positiveInt }) } },
    async (request, reply) => {
      const { lessonId, studentId } = request.body

      const [lesson] = await db
        .select({ status: lessons.status, title: lessons.title })
        .from(lessons)
        .where(eq(lessons.id, lessonId))
      if (!lesson) throw app.httpErrors.notFound('Lesson not found.')
      if (lesson.status !== 'published') {
        throw app.httpErrors.conflict('Publish the lesson before assigning it to students.')
      }

      const [student] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      if (!student) throw app.httpErrors.notFound('Student not found.')

      const created = await db
        .insert(lessonAssignments)
        .values({ lessonId, studentId })
        .onConflictDoNothing()
        .returning({ id: lessonAssignments.id })

      if (created.length > 0) {
        await notifyUser(studentId, {
          type: 'lesson_assigned',
          title: 'New lesson',
          body: lesson.title,
          link: `/lessons/${lessonId}`,
        })
      }

      return reply.code(204).send()
    },
  )

  app.delete('/lesson-assignments/:id', { schema: { params: idParams } }, async (request, reply) => {
    await db.delete(lessonAssignments).where(eq(lessonAssignments.id, request.params.id))
    return reply.code(204).send()
  })
}