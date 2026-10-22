import { asc, count, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { isForeignKeyViolation } from '../db/errors.ts'
import { fetchLessons } from '../db/lesson-queries.ts'
import { lessonMaterials, lessons } from '../db/schema/index.ts'
import { lessonSchema, materialInput } from './lesson-schemas.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })
const title = z.string().trim().min(1).max(200)
const description = z.string().trim().max(2000)
const status = z.enum(['draft', 'published'])

export const lessonRoutes: FastifyPluginAsyncZod = async (app) => {
  // Everything in this file is teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  app.get('/lessons', { schema: { response: { 200: z.array(lessonSchema) } } }, async () =>
    fetchLessons(),
  )

  app.get(
    '/lessons/:id',
    { schema: { params: idParams, response: { 200: lessonSchema } } },
    async (request) => {
      const [lesson] = await fetchLessons(eq(lessons.id, request.params.id))
      if (!lesson) throw app.httpErrors.notFound('Lesson not found.')
      return lesson
    },
  )

  app.post(
    '/lessons',
    {
      schema: {
        body: z
          .object({
            title,
            description,
            status,
            materials: z.array(materialInput).max(50),
          })
          .refine(
            (b) => b.status !== 'published' || b.materials.length > 0,
            'A published lesson needs at least one material.',
          ),
        response: { 201: lessonSchema },
      },
    },
    async (request, reply) => {
      const input = request.body

      const lessonId = await db.transaction(async (tx) => {
        const [lesson] = await tx
          .insert(lessons)
          .values({
            title: input.title,
            description: input.description,
            status: input.status,
            createdBy: request.user.id,
          })
          .returning({ id: lessons.id })

        if (input.materials.length > 0) {
          await tx
            .insert(lessonMaterials)
            .values(input.materials.map((m, position) => ({ lessonId: lesson.id, position, ...m })))
        }
        return lesson.id
      })

      const [created] = await fetchLessons(eq(lessons.id, lessonId))
      return reply.code(201).send(created)
    },
  )

  // Send only what changes. If "materials" is sent, it replaces the whole list.
  app.patch(
    '/lessons/:id',
    {
      schema: {
        params: idParams,
        body: z
          .object({
            title: title.optional(),
            description: description.optional(),
            status: status.optional(),
            materials: z.array(materialInput).max(50).optional(),
          })
          .refine((b) => Object.keys(b).length > 0, 'Nothing to update.'),
        response: { 200: lessonSchema },
      },
    },
    async (request) => {
      const { id } = request.params
      const { materials, ...fields } = request.body

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ status: lessons.status })
          .from(lessons)
          .where(eq(lessons.id, id))
        if (!existing) throw app.httpErrors.notFound('Lesson not found.')

        const [{ total }] = await tx
          .select({ total: count() })
          .from(lessonMaterials)
          .where(eq(lessonMaterials.lessonId, id))

        const nextStatus = fields.status ?? existing.status
        const nextMaterialCount = materials?.length ?? total
        if (nextStatus === 'published' && nextMaterialCount === 0) {
          throw app.httpErrors.badRequest('A published lesson needs at least one material.')
        }

        await tx
          .update(lessons)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(lessons.id, id))

        if (materials) {
          await tx.delete(lessonMaterials).where(eq(lessonMaterials.lessonId, id))
          if (materials.length > 0) {
            await tx
              .insert(lessonMaterials)
              .values(materials.map((m, position) => ({ lessonId: id, position, ...m })))
          }
        }
      })

      const [lesson] = await fetchLessons(eq(lessons.id, id))
      return lesson
    },
  )

  app.delete('/lessons/:id', { schema: { params: idParams } }, async (request, reply) => {
    try {
      const [deleted] = await db
        .delete(lessons)
        .where(eq(lessons.id, request.params.id))
        .returning({ id: lessons.id })
      if (!deleted) throw app.httpErrors.notFound('Lesson not found.')
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw app.httpErrors.conflict(
          'This lesson is assigned to students or has homework. Unpublish it instead, or remove its assignments and homework first.',
        )
      }
      throw error
    }
    return reply.code(204).send()
  })

  app.post(
    '/lessons/:id/duplicate',
    { schema: { params: idParams, response: { 201: lessonSchema } } },
    async (request, reply) => {
      const { id } = request.params

      const copyId = await db.transaction(async (tx) => {
        const [original] = await tx.select().from(lessons).where(eq(lessons.id, id))
        if (!original) throw app.httpErrors.notFound('Lesson not found.')

        const materials = await tx
          .select()
          .from(lessonMaterials)
          .where(eq(lessonMaterials.lessonId, id))
          .orderBy(asc(lessonMaterials.position), asc(lessonMaterials.id))

        const [copy] = await tx
          .insert(lessons)
          .values({
            title: `${original.title} (copy)`.slice(0, 200),
            description: original.description,
            status: 'draft',
            createdBy: request.user.id,
          })
          .returning({ id: lessons.id })

        if (materials.length > 0) {
          await tx.insert(lessonMaterials).values(
            materials.map((m) => ({
              lessonId: copy.id,
              type: m.type,
              title: m.title,
              url: m.url,
              position: m.position,
            })),
          )
        }
        return copy.id
      })

      const [created] = await fetchLessons(eq(lessons.id, copyId))
      return reply.code(201).send(created)
    },
  )
}