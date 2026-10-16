import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { and, asc, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { isUniqueViolation } from '../db/errors.ts'
import { users } from '../db/schema/index.ts'

const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  status: z.enum(['pending', 'active', 'inactive']),
})

const idParams = z.object({ id: z.coerce.number().int().positive() })
const nameField = z.string().trim().min(1).max(100)
const emailField = z.string().trim().toLowerCase().email().max(254)

const columns = { id: users.id, name: users.name, email: users.email, status: users.status }

const newTemporaryPassword = () => randomBytes(9).toString('base64url')

export const studentRoutes: FastifyPluginAsyncZod = async (app) => {
  // Everything in this file is teacher-only
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  app.get('/students', { schema: { response: { 200: z.array(studentSchema) } } }, async () =>
    db.select(columns).from(users).where(eq(users.role, 'student')).orderBy(asc(users.name)),
  )

  app.post(
    '/students',
    {
      schema: {
        body: z.object({ name: nameField, email: emailField }),
        response: { 201: z.object({ student: studentSchema, temporaryPassword: z.string() }) },
      },
    },
    async (request, reply) => {
      const temporaryPassword = newTemporaryPassword()
      try {
        const [student] = await db
          .insert(users)
          .values({
            name: request.body.name,
            email: request.body.email,
            passwordHash: await argon2.hash(temporaryPassword),
            role: 'student',
            status: 'active', // added by the teacher, so no approval needed
          })
          .returning(columns)
        return reply.code(201).send({ student, temporaryPassword })
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw app.httpErrors.conflict('A student with this email already exists.')
        }
        throw error
      }
    },
  )

  // Also how sign-ups are approved: status 'pending' -> 'active'
  app.patch(
    '/students/:id',
    {
      schema: {
        params: idParams,
        body: z
          .object({
            name: nameField.optional(),
            email: emailField.optional(),
            status: z.enum(['active', 'inactive']).optional(),
          })
          .refine((body) => Object.keys(body).length > 0, 'Nothing to update.'),
        response: { 200: studentSchema },
      },
    },
    async (request) => {
      try {
        const [student] = await db
          .update(users)
          .set(request.body)
          .where(and(eq(users.id, request.params.id), eq(users.role, 'student')))
          .returning(columns)
        if (!student) throw app.httpErrors.notFound('Student not found.')
        return student
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw app.httpErrors.conflict('A student with this email already exists.')
        }
        throw error
      }
    },
  )

  // Rejecting a sign-up removes the pending account. Active students can only be deactivated.
  app.delete('/students/:id', { schema: { params: idParams } }, async (request, reply) => {
    const [deleted] = await db
      .delete(users)
      .where(
        and(
          eq(users.id, request.params.id),
          eq(users.role, 'student'),
          eq(users.status, 'pending'),
        ),
      )
      .returning({ id: users.id })

    if (!deleted) throw app.httpErrors.conflict('Only pending sign-ups can be rejected.')
    return reply.code(204).send()
  })

  app.post(
    '/students/:id/reset-password',
    {
      schema: {
        params: idParams,
        response: { 200: z.object({ temporaryPassword: z.string() }) },
      },
    },
    async (request) => {
      const temporaryPassword = newTemporaryPassword()
      const [student] = await db
        .update(users)
        .set({ passwordHash: await argon2.hash(temporaryPassword) })
        .where(and(eq(users.id, request.params.id), eq(users.role, 'student')))
        .returning({ id: users.id })
      if (!student) throw app.httpErrors.notFound('Student not found.')
      return { temporaryPassword }
    },
  )
}