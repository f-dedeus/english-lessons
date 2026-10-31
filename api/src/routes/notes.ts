import { and, desc, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { notes, users } from '../db/schema/index.ts'
import { notifyUser } from '../notifications.ts'

const noteSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  text: z.string(),
  color: z.enum(['yellow', 'pink', 'blue', 'green']),
  pinned: z.boolean(),
  dismissed: z.boolean(),
  createdAt: z.string(), // ISO date
})

const idParams = z.object({ id: z.coerce.number().int().positive() })

type NoteRow = typeof notes.$inferSelect

const toNote = (n: NoteRow) => ({
  id: n.id,
  studentId: n.studentId,
  text: n.text,
  color: n.color,
  pinned: n.pinned,
  dismissed: n.dismissed,
  createdAt: n.createdAt.toISOString(),
})

// Pinned first, then newest
const pinnedThenNewest = [desc(notes.pinned), desc(notes.createdAt), desc(notes.id)]

// ---- Teacher ----

export const noteRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('teacher'))

  // Everything for one student, including notes they already dismissed
  app.get(
    '/students/:id/notes',
    { schema: { params: idParams, response: { 200: z.array(noteSchema) } } },
    async (request) => {
      const rows = await db
        .select()
        .from(notes)
        .where(eq(notes.studentId, request.params.id))
        .orderBy(...pinnedThenNewest)
      return rows.map(toNote)
    },
  )

  app.post(
    '/students/:id/notes',
    {
      schema: {
        params: idParams,
        body: z.object({
          text: z.string().trim().min(1).max(280),
          color: z.enum(['yellow', 'pink', 'blue', 'green']),
          pinned: z.boolean(),
        }),
        response: { 201: noteSchema },
      },
    },
    async (request, reply) => {
      const [student] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, request.params.id), eq(users.role, 'student')))
      if (!student) throw app.httpErrors.notFound('Student not found.')

      const [note] = await db
        .insert(notes)
        .values({ ...request.body, studentId: student.id, createdBy: request.user.id })
        .returning()

      await notifyUser(student.id, {
        type: 'note',
        title: 'New note from your teacher',
        body: note.text.slice(0, 80),
        link: '/',
      })
      
      return reply.code(201).send(toNote(note))
    },
  )

  app.patch(
    '/notes/:id',
    {
      schema: {
        params: idParams,
        body: z.object({ pinned: z.boolean() }),
        response: { 200: noteSchema },
      },
    },
    async (request) => {
      const [note] = await db
        .update(notes)
        .set({ pinned: request.body.pinned })
        .where(eq(notes.id, request.params.id))
        .returning()
      if (!note) throw app.httpErrors.notFound('Note not found.')
      return toNote(note)
    },
  )

  app.delete('/notes/:id', { schema: { params: idParams } }, async (request, reply) => {
    await db.delete(notes).where(eq(notes.id, request.params.id))
    return reply.code(204).send()
  })
}

// ---- Student ----

export const myNoteRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', app.requireRole('student'))

  app.get('/me/notes', { schema: { response: { 200: z.array(noteSchema) } } }, async (request) => {
    const rows = await db
      .select()
      .from(notes)
      .where(and(eq(notes.studentId, request.user.id), eq(notes.dismissed, false)))
      .orderBy(...pinnedThenNewest)
    return rows.map(toNote)
  })

  // The only thing a student can do to a note
  app.post('/me/notes/:id/dismiss', { schema: { params: idParams } }, async (request, reply) => {
    const [note] = await db
      .update(notes)
      .set({ dismissed: true })
      .where(and(eq(notes.id, request.params.id), eq(notes.studentId, request.user.id)))
      .returning({ id: notes.id })

    // Same answer for "doesn't exist" and "belongs to someone else"
    if (!note) throw app.httpErrors.notFound('Note not found.')
    return reply.code(204).send()
  })
}