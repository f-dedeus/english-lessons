import { and, asc, count, eq, inArray, isNotNull, or } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { fetchHomework } from '../db/homework-queries.ts'
import {
  homework,
  homeworkAssignments,
  homeworkQuestions,
  lessons,
  submissions,
  users,
} from '../db/schema/index.ts'
import { sameJson } from '../homework/questions.ts'
import { isExpired } from '../homework/timer.ts'
import { notifyUsers } from '../notifications.ts'
import { assignmentSchema, homeworkSchema, questionInput } from './homework-schemas.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })
const positiveInt = z.number().int().positive()
const title = z.string().trim().min(1).max(200)
const instructions = z.string().trim().max(2000)
const timeLimit = z.number().int().min(1).max(600).nullable()

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, 'Choose a valid due date.')

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Locked once any student has started it (timed) or sent answers
async function isLocked(tx: Tx, homeworkId: number) {
  const [{ total }] = await tx
    .select({ total: count() })
    .from(homeworkAssignments)
    .leftJoin(submissions, eq(submissions.homeworkAssignmentId, homeworkAssignments.id))
    .where(
      and(
        eq(homeworkAssignments.homeworkId, homeworkId),
        or(isNotNull(homeworkAssignments.startedAt), isNotNull(submissions.id)),
      ),
    )
  return total > 0
}

export const homeworkRoutes: FastifyPluginAsyncZod = async (app) => {
  // Teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  app.get('/homework', { schema: { response: { 200: z.array(homeworkSchema) } } }, async () =>
    fetchHomework(),
  )

  app.post(
    '/homework',
    {
      schema: {
        body: z.object({
          lessonId: positiveInt,
          title,
          instructions,
          timeLimitMinutes: timeLimit,
          questions: z.array(questionInput).min(1, 'Add at least one question.').max(50),
        }),
        response: { 201: homeworkSchema },
      },
    },
    async (request, reply) => {
      const input = request.body

      const homeworkId = await db.transaction(async (tx) => {
        const [lesson] = await tx
          .select({ id: lessons.id })
          .from(lessons)
          .where(eq(lessons.id, input.lessonId))
        if (!lesson) throw app.httpErrors.badRequest('Lesson not found.')

        const [created] = await tx
          .insert(homework)
          .values({
            lessonId: input.lessonId,
            title: input.title,
            instructions: input.instructions,
            timeLimitMinutes: input.timeLimitMinutes,
          })
          .returning({ id: homework.id })

        await tx
          .insert(homeworkQuestions)
          .values(input.questions.map((content, position) => ({ homeworkId: created.id, position, content })))

        return created.id
      })

      const [created] = await fetchHomework(eq(homework.id, homeworkId))
      return reply.code(201).send(created)
    },
  )

  app.patch(
    '/homework/:id',
    {
      schema: {
        params: idParams,
        body: z
          .object({
            lessonId: positiveInt.optional(),
            title: title.optional(),
            instructions: instructions.optional(),
            timeLimitMinutes: timeLimit.optional(),
            questions: z.array(questionInput).min(1).max(50).optional(),
          })
          .refine((body) => Object.keys(body).length > 0, 'Nothing to update.'),
        response: { 200: homeworkSchema },
      },
    },
    async (request) => {
      const { id } = request.params
      const { questions, ...fields } = request.body

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: homework.id, timeLimitMinutes: homework.timeLimitMinutes })
          .from(homework)
          .where(eq(homework.id, id))
        if (!existing) throw app.httpErrors.notFound('Homework not found.')

        if (fields.lessonId !== undefined) {
          const [lesson] = await tx
            .select({ id: lessons.id })
            .from(lessons)
            .where(eq(lessons.id, fields.lessonId))
          if (!lesson) throw app.httpErrors.badRequest('Lesson not found.')
        }

        const limitChanges =
          fields.timeLimitMinutes !== undefined && fields.timeLimitMinutes !== existing.timeLimitMinutes
        const locked = questions || limitChanges ? await isLocked(tx, id) : false

        if (limitChanges && locked) {
          throw app.httpErrors.conflict(
            "Students already started or answered this homework, so its time limit can't be changed. Duplicate the homework to make a different version.",
          )
        }

        if (questions) {
          const current = await tx
            .select({ content: homeworkQuestions.content })
            .from(homeworkQuestions)
            .where(eq(homeworkQuestions.homeworkId, id))
            .orderBy(asc(homeworkQuestions.position), asc(homeworkQuestions.id))

          const unchanged = sameJson(
            current.map((q) => q.content),
            questions,
          )

          if (locked) {
            // The questions can only be sent back exactly as they are
            if (!unchanged) {
              throw app.httpErrors.conflict(
                "Students already started or answered this homework, so its questions can't be changed. Duplicate the homework to make a different version.",
              )
            }
          } else if (!unchanged) {
            await tx.delete(homeworkQuestions).where(eq(homeworkQuestions.homeworkId, id))
            await tx
              .insert(homeworkQuestions)
              .values(questions.map((content, position) => ({ homeworkId: id, position, content })))
          }
        }

        if (Object.keys(fields).length > 0) {
          await tx.update(homework).set(fields).where(eq(homework.id, id))
        }
      })

      const [updated] = await fetchHomework(eq(homework.id, id))
      return updated
    },
  )

  // Also removes the assignments and any answers (the teacher is warned first)
  app.delete('/homework/:id', { schema: { params: idParams } }, async (request, reply) => {
    const [deleted] = await db
      .delete(homework)
      .where(eq(homework.id, request.params.id))
      .returning({ id: homework.id })
    if (!deleted) throw app.httpErrors.notFound('Homework not found.')
    return reply.code(204).send()
  })

  // An editable copy, not assigned to anyone
  app.post(
    '/homework/:id/duplicate',
    { schema: { params: idParams, response: { 201: homeworkSchema } } },
    async (request, reply) => {
      const { id } = request.params

      const copyId = await db.transaction(async (tx) => {
        const [original] = await tx.select().from(homework).where(eq(homework.id, id))
        if (!original) throw app.httpErrors.notFound('Homework not found.')

        const questions = await tx
          .select()
          .from(homeworkQuestions)
          .where(eq(homeworkQuestions.homeworkId, id))
          .orderBy(asc(homeworkQuestions.position), asc(homeworkQuestions.id))

        const [copy] = await tx
          .insert(homework)
          .values({
            lessonId: original.lessonId,
            title: `${original.title} (copy)`.slice(0, 200),
            instructions: original.instructions,
            timeLimitMinutes: original.timeLimitMinutes,
          })
          .returning({ id: homework.id })

        if (questions.length > 0) {
          await tx
            .insert(homeworkQuestions)
            .values(questions.map((q, position) => ({ homeworkId: copy.id, position, content: q.content })))
        }
        return copy.id
      })

      const [created] = await fetchHomework(eq(homework.id, copyId))
      return reply.code(201).send(created)
    },
  )

  // ---- Giving homework to students ----

  app.get(
    '/homework-assignments',
    { schema: { response: { 200: z.array(assignmentSchema) } } },
    async () => {
      const rows = await db
        .select({ a: homeworkAssignments, limit: homework.timeLimitMinutes })
        .from(homeworkAssignments)
        .innerJoin(homework, eq(homeworkAssignments.homeworkId, homework.id))
        .orderBy(asc(homeworkAssignments.id))

      return rows.map(({ a, limit }) => ({
        id: a.id,
        homeworkId: a.homeworkId,
        studentId: a.studentId,
        dueDate: a.dueDate,
        status: a.status,
        startedAt: a.startedAt?.toISOString(),
        expired: isExpired({ limitMinutes: limit, startedAt: a.startedAt, status: a.status }),
      }))
    },
  )

  // Students who already have it are skipped (and are not notified again)
  app.post(
    '/homework/:id/assign',
    {
      schema: {
        params: idParams,
        body: z.object({ studentIds: z.array(positiveInt).min(1).max(500), dueDate }),
      },
    },
    async (request, reply) => {
      const homeworkId = request.params.id
      const studentIds = [...new Set(request.body.studentIds)]

      const [existing] = await db
        .select({ id: homework.id, title: homework.title })
        .from(homework)
        .where(eq(homework.id, homeworkId))
      if (!existing) throw app.httpErrors.notFound('Homework not found.')

      const found = await db
        .select({ id: users.id })
        .from(users)
        .where(and(inArray(users.id, studentIds), eq(users.role, 'student')))
      if (found.length !== studentIds.length) {
        throw app.httpErrors.badRequest('One or more students do not exist.')
      }

      const created = await db
        .insert(homeworkAssignments)
        .values(studentIds.map((studentId) => ({ homeworkId, studentId, dueDate: request.body.dueDate })))
        .onConflictDoNothing()
        .returning({ studentId: homeworkAssignments.studentId })

      // Only the students who just received it are notified
      await notifyUsers(
        created.map((row) => row.studentId),
        {
          type: 'homework_assigned',
          title: 'New homework',
          body: `${existing.title} · due ${request.body.dueDate}`,
          link: '/homework',
        },
      )

      return reply.code(204).send()
    },
  )

  // Also deletes that student's answer, if there is one
  app.delete('/homework-assignments/:id', { schema: { params: idParams } }, async (request, reply) => {
    await db.delete(homeworkAssignments).where(eq(homeworkAssignments.id, request.params.id))
    return reply.code(204).send()
  })

  // Another attempt: deletes the answer and grade (if any) and resets the timer
  app.post('/homework-assignments/:id/reset', { schema: { params: idParams } }, async (request, reply) => {
    const { id } = request.params

    await db.transaction(async (tx) => {
      const [assignment] = await tx
        .select({ id: homeworkAssignments.id })
        .from(homeworkAssignments)
        .where(eq(homeworkAssignments.id, id))
      if (!assignment) throw app.httpErrors.notFound('Assignment not found.')

      await tx.delete(submissions).where(eq(submissions.homeworkAssignmentId, id))
      await tx
        .update(homeworkAssignments)
        .set({ status: 'pending', startedAt: null })
        .where(eq(homeworkAssignments.id, id))
    })

    return reply.code(204).send()
  })
}