import argon2 from 'argon2'
import { and, eq, sql } from 'drizzle-orm'
import { env } from '../env.ts'
import { db, pool } from './client.ts'
import { users } from './schema/index.ts'

const email = process.env.TEACHER_EMAIL?.trim().toLowerCase()
const password = process.env.TEACHER_PASSWORD

async function main() {
  console.log('Database host:', new URL(env.DATABASE_URL).hostname)

  if (!email || !password) throw new Error('Set TEACHER_EMAIL and TEACHER_PASSWORD first.')
  if (password.length < 12) throw new Error('Use a temporary password with at least 12 characters.')

  const [updated] = await db
    .update(users)
    .set({ passwordHash: await argon2.hash(password), mustChangePassword: true })
    .where(and(sql`lower(${users.email}) = ${email}`, eq(users.role, 'teacher')))
    .returning({ id: users.id })

  if (!updated) throw new Error('There is no teacher account with that email.')

  console.log('Password reset. The teacher must choose a new one at the next login.')
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())