import { fastifyCors } from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifySensible from '@fastify/sensible'
import { sql } from 'drizzle-orm'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { db } from './db/client.ts'
import { env } from './env.ts'
import { authPlugin } from './plugins/auth.ts'
import { authRoutes } from './routes/auth.ts'
import { studentRoutes } from './routes/students.ts'
import { paymentRoutes } from './routes/payments.ts'
import type { FastifyError } from 'fastify'
import { lessonAssignmentRoutes } from './routes/lesson-assignments.ts'
import { lessonRoutes } from './routes/lessons.ts'
import { myLessonRoutes } from './routes/my-lessons.ts'
import { myNoteRoutes, noteRoutes } from './routes/notes.ts'
import { homeworkRoutes } from './routes/homework.ts'
import { myHomeworkRoutes } from './routes/my-homework.ts'
import { submissionRoutes } from './routes/submissions.ts'
import { myPlacementRoutes } from './routes/my-placement.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()


function friendlyValidationMessage(error: FastifyError): string {
  const raw = (error.validation?.[0] as { message?: unknown } | undefined)?.message ?? error.message
  const text = typeof raw === 'string' ? raw : 'Some of the data is not valid.'
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && typeof parsed[0]?.message === 'string') return parsed[0].message
  } catch {
    /* not JSON, use the text as it is */
  }
  return text
}

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler((error: FastifyError, request, reply) => {
  if (error.validation) {
    return reply
      .code(400)
      .send({ statusCode: 400, error: 'Bad Request', message: friendlyValidationMessage(error) })
  }
  return reply.send(error)
})

await app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})
await app.register(fastifySensible)
await app.register(fastifyRateLimit, { global: false }) // only routes that ask for it
await app.register(authPlugin)
await app.register(authRoutes)
await app.register(studentRoutes)
await app.register(paymentRoutes)
await app.register(lessonRoutes)
await app.register(myLessonRoutes)
await app.register(lessonAssignmentRoutes)
await app.register(noteRoutes)
await app.register(myNoteRoutes)
await app.register(homeworkRoutes)
await app.register(myHomeworkRoutes)
await app.register(submissionRoutes)
await app.register(myPlacementRoutes)

app.get('/health', () => 'OK')

app.get('/health/db', async () => {
  await db.execute(sql`select 1`)
  return 'DB OK'
})

// Temporary: lets us test the teacher-only guard. Remove once real teacher routes exist.
app.get('/admin/ping', { preHandler: [app.authenticate, app.requireRole('teacher')] }, () => 'teacher OK')

await app.listen({ port: env.PORT, host: '0.0.0.0' })
console.log(`Server is running on http://localhost:${env.PORT}`)