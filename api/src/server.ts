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

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

await app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})
await app.register(fastifySensible)
await app.register(fastifyRateLimit, { global: false }) // only routes that ask for it
await app.register(authPlugin)
await app.register(authRoutes)

app.get('/health', () => 'OK')

app.get('/health/db', async () => {
  await db.execute(sql`select 1`)
  return 'DB OK'
})

// Temporary: lets us test the teacher-only guard. Remove once real teacher routes exist.
app.get('/admin/ping', { preHandler: [app.authenticate, app.requireRole('teacher')] }, () => 'teacher OK')

await app.listen({ port: env.PORT, host: '0.0.0.0' })
console.log(`Server is running on http://localhost:${env.PORT}`)