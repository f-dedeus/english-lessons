import argon2 from 'argon2'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { isUniqueViolation } from '../db/errors.ts'
import { users } from '../db/schema/index.ts'

// Checked when the email doesn't exist, so unknown emails take as long as wrong passwords
const DUMMY_HASH = await argon2.hash('not-a-real-password')

const publicUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['teacher', 'student']),
  mustChangePassword: z.boolean(),
})

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: z.object({
          email: z.string().trim().toLowerCase().email().max(254),
          password: z.string().min(1).max(200),
        }),
        response: { 200: z.object({ token: z.string(), user: publicUser }) },
      },
    },
    async (request) => {
      const { email, password } = request.body

      const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`)

      const passwordMatches = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password)
      if (!user || !passwordMatches) {
        // Same message for "no such email" and "wrong password"
        throw app.httpErrors.unauthorized('Invalid email or password.')
      }
      if (user.status === 'pending') {
        throw app.httpErrors.forbidden("Your account is waiting for your teacher's approval.")
      }
      if (user.status === 'inactive') {
        throw app.httpErrors.forbidden('This account is inactive. Please contact your teacher.')
      }

      const token = app.jwt.sign({ id: user.id, role: user.role })
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      }
    },
  )

  app.post(
    '/auth/signup',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
      schema: {
        body: z.object({
          name: z.string().trim().min(1).max(100),
          email: z.string().trim().toLowerCase().email().max(254),
          password: z.string().min(8).max(200),
        }),
        response: { 201: z.object({ message: z.string() }) },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body

      try {
        await db.insert(users).values({
          name,
          email,
          passwordHash: await argon2.hash(password),
          role: 'student',
          status: 'pending',
        })
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw app.httpErrors.conflict('An account with this email already exists.')
        }
        throw error
      }

      return reply
        .code(201)
        .send({ message: 'Account created. Your teacher needs to approve it before you can log in.' })
    },
  )

  // Doesn't send an email: it flags the student so the teacher sees the request.
  // The answer is always the same, so it can't be used to find out who has an account.
  app.post(
    '/auth/forgot-password',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
      schema: {
        body: z.object({ email: z.string().trim().toLowerCase().email().max(254) }),
        response: { 202: z.object({ message: z.string() }) },
      },
    },
    async (request, reply) => {
      await db
        .update(users)
        .set({ passwordResetRequestedAt: new Date() })
        .where(
          and(
            sql`lower(${users.email}) = ${request.body.email}`,
            eq(users.role, 'student'),
            inArray(users.status, ['active', 'pending']),
          ),
        )

      return reply.code(202).send({
        message:
          'If an account exists with this email, your teacher has been notified and will contact you with a new password.',
      })
    },
  )

  app.get(
    '/auth/me',
    {
      preHandler: [app.authenticate],
      config: { allowPasswordChange: true },
      schema: { response: { 200: publicUser } },
    },
    async (request) => {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          mustChangePassword: users.mustChangePassword,
        })
        .from(users)
        .where(eq(users.id, request.user.id))

      if (!user) throw app.httpErrors.unauthorized('Please log in.')
      return user
    },
  )

  app.post(
    '/auth/change-password',
    {
      preHandler: [app.authenticate],
      config: { rateLimit: { max: 5, timeWindow: '1 minute' }, allowPasswordChange: true },
      schema: {
        body: z.object({
          currentPassword: z.string().min(1).max(200),
          newPassword: z.string().min(8).max(200),
        }),
      },
    },
    async (request, reply) => {
      const [user] = await db.select().from(users).where(eq(users.id, request.user.id))

      if (!user || !(await argon2.verify(user.passwordHash, request.body.currentPassword))) {
        throw app.httpErrors.badRequest('Current password is incorrect.')
      }

      await db
        .update(users)
        .set({
          passwordHash: await argon2.hash(request.body.newPassword),
          mustChangePassword: false,
          passwordResetRequestedAt: null,
        })
        .where(eq(users.id, user.id))

      return reply.code(204).send()
    },
  )
}