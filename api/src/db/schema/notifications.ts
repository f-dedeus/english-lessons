import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createdAt, id } from './helpers.ts'
import { users } from './users.ts'

export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text().notNull(), // for example 'signup', 'homework_graded'
    title: text().notNull(),
    body: text().notNull().default(''),
    link: text(), // the page to open when it is clicked
    createdAt: createdAt(),
    readAt: timestamp({ withTimezone: true }),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
)