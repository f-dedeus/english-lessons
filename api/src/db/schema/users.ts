import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { userRole } from './enums.ts'
import { createdAt, id } from './helpers.ts'

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text().notNull(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    role: userRole().notNull().default('student'),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_email_unique').on(sql`lower(${t.email})`)],
)