import argon2 from 'argon2'
import { eq, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { users } from '../db/schema/index.ts'

// Checked when the email doesn't exist, so unknown emails take as long as wrong passwords
const DUMMY_HASH = await argon2.hash('not-a-real-password')

const publicUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['teacher', 'student']),
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
      if (!user.active) {
        throw app.httpErrors.forbidden('This account is inactive. Please contact your teacher.')
      }

      const token = app.jwt.sign({ id: user.id, role: user.role })
      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }
    },
  )

  app.get(
    '/auth/me',
    {
      preHandler: [app.authenticate],
      schema: { response: { 200: publicUser } },
    },
    async (request) => {
      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
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
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
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
        throw app.httpErrors.unauthorized('Current password is incorrect.')
      }

      await db
        .update(users)
        .set({ passwordHash: await argon2.hash(request.body.newPassword) })
        .where(eq(users.id, user.id))

      return reply.code(204).send()
    },
  )
}