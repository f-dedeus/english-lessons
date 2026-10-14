import { integer, timestamp } from 'drizzle-orm/pg-core'

export const id = () => integer().primaryKey().generatedAlwaysAsIdentity()
export const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()