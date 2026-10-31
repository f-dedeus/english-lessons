import { and, count, desc, eq, isNull } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { notifications } from '../db/schema/index.ts'

const idParams = z.object({ id: z.coerce.number().int().positive() })

const item = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().optional(),
  createdAt: z.string(),
  read: z.boolean(),
})

export const notificationRoutes: FastifyPluginAsyncZod = async (app) => {
  // Any logged-in user, but only their own notifications
  app.addHook('onRequest', app.authenticate)

  app.get(
    '/notifications',
    { schema: { response: { 200: z.object({ unreadCount: z.number(), items: z.array(item) }) } } },
    async (request) => {
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, request.user.id))
        .orderBy(desc(notifications.createdAt), desc(notifications.id))
        .limit(30)

      const [{ total }] = await db
        .select({ total: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, request.user.id), isNull(notifications.readAt)))

      return {
        unreadCount: total,
        items: rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link ?? undefined,
          createdAt: n.createdAt.toISOString(),
          read: n.readAt !== null,
        })),
      }
    },
  )

  app.post('/notifications/read-all', async (request, reply) => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, request.user.id), isNull(notifications.readAt)))
    return reply.code(204).send()
  })

  app.post('/notifications/:id/read', { schema: { params: idParams } }, async (request, reply) => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, request.params.id),
          eq(notifications.userId, request.user.id),
          isNull(notifications.readAt),
        ),
      )
    return reply.code(204).send()
  })
}