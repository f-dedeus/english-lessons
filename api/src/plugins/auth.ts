import fastifyJwt from '@fastify/jwt'
import { eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { db } from '../db/client.ts'
import { users } from '../db/schema/index.ts'
import { env } from '../env.ts'

export type Role = 'teacher' | 'student'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; role: Role }
    user: { id: number; role: Role }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>
    requireRole: (role: Role) => (request: FastifyRequest) => Promise<void>
  }

  // Routes with this setting can be used while a password change is still required
  interface FastifyContextConfig {
    allowPasswordChange?: boolean
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // Must be logged in, with an account that still exists and is active
  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify()
    } catch {
      throw app.httpErrors.unauthorized('Please log in.')
    }

    const [account] = await db
      .select({ role: users.role, status: users.status, mustChangePassword: users.mustChangePassword })
      .from(users)
      .where(eq(users.id, request.user.id))

    if (!account || account.status !== 'active') throw app.httpErrors.unauthorized('Please log in.')

    // Still on a temporary password: only the routes that allow it can be used
    if (account.mustChangePassword && !request.routeOptions.config.allowPasswordChange) {
      throw app.httpErrors.forbidden('You must choose a new password before continuing.')
    }

    // Trust the database over the token: role changes apply immediately
    request.user = { id: request.user.id, role: account.role }
  })

  // Use after authenticate: only lets this role through
  app.decorate('requireRole', (role: Role) => async (request: FastifyRequest) => {
    if (request.user.role !== role) {
      throw app.httpErrors.forbidden('You do not have permission to do this.')
    }
  })
})