import argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { env } from '../env.ts'
import { db, pool } from './client.ts'
import { users } from './schema/index.ts'

const name = process.env.TEACHER_NAME?.trim()
const email = process.env.TEACHER_EMAIL?.trim().toLowerCase()
const password = process.env.TEACHER_PASSWORD

async function main() {
  console.log('Database host:', new URL(env.DATABASE_URL).hostname)

  if (!name || !email || !password) {
    throw new Error('Set TEACHER_NAME, TEACHER_EMAIL and TEACHER_PASSWORD first.')
  }
  if (password.length < 12) throw new Error('Use a temporary password with at least 12 characters.')

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'teacher'))
  if (existing) throw new Error('A teacher account already exists. This script only creates the first one.')

  await db.insert(users).values({
    name,
    email,
    passwordHash: await argon2.hash(password),
    role: 'teacher',
    status: 'active',
    mustChangePassword: true, // the teacher chooses their own password at the first login
  })

  console.log(`Teacher account created for ${email}.`)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())