import { and, eq, gte, lte } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { payments, users } from '../db/schema/index.ts'

const paymentSchema = z.object({
  studentId: z.number(),
  month: z.string(), // 2026-10
  note: z.string().nullable(),
})

const params = z.object({
  studentId: z.coerce.number().int().positive(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'The month must look like 2026-10.'),
})

const toDate = (month: string) => `${month}-01`

export const paymentRoutes: FastifyPluginAsyncZod = async (app) => {
  // Teacher-only: students never see payment records
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  app.get(
    '/payments',
    {
      schema: {
        querystring: z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() }),
        response: { 200: z.array(paymentSchema) },
      },
    },
    async (request) => {
      const year = request.query.year ?? new Date().getFullYear()

      const rows = await db
        .select()
        .from(payments)
        .where(and(gte(payments.month, `${year}-01-01`), lte(payments.month, `${year}-12-01`)))

      return rows.map((r) => ({ studentId: r.studentId, month: r.month.slice(0, 7), note: r.note }))
    },
  )

  // Marks the month as paid (or updates its note)
  app.put(
    '/payments/:studentId/:month',
    {
      schema: {
        params,
        body: z.object({ note: z.string().trim().max(200).nullable().optional() }),
        response: { 200: paymentSchema },
      },
    },
    async (request) => {
      const { studentId, month } = request.params

      const [student] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      if (!student) throw app.httpErrors.notFound('Student not found.')

      const note = request.body.note || null

      const [row] = await db
        .insert(payments)
        .values({ studentId, month: toDate(month), note })
        .onConflictDoUpdate({ target: [payments.studentId, payments.month], set: { note } })
        .returning()

      return { studentId: row.studentId, month: row.month.slice(0, 7), note: row.note }
    },
  )

  // Marks the month as not paid
  app.delete('/payments/:studentId/:month', { schema: { params } }, async (request, reply) => {
    const { studentId, month } = request.params
    await db
      .delete(payments)
      .where(and(eq(payments.studentId, studentId), eq(payments.month, toDate(month))))
    return reply.code(204).send()
  })
}