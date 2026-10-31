import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from './db/client.ts'
import { notifications, users } from './db/schema/index.ts'

export type NotificationDraft = {
  type: string
  title: string
  body?: string
  link?: string
}

// dedupe: skip people who already have an identical notification they haven't read
type Options = { dedupe?: boolean }

async function insertFor(userIds: number[], draft: NotificationDraft, options: Options) {
  let targets = [...new Set(userIds)]
  if (targets.length === 0) return

  if (options.dedupe) {
    const existing = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          inArray(notifications.userId, targets),
          eq(notifications.type, draft.type),
          eq(notifications.title, draft.title),
          eq(notifications.body, draft.body ?? ''),
          isNull(notifications.readAt),
        ),
      )
    const skip = new Set(existing.map((row) => row.userId))
    targets = targets.filter((id) => !skip.has(id))
    if (targets.length === 0) return
  }

  await db.insert(notifications).values(
    targets.map((userId) => ({
      userId,
      type: draft.type,
      title: draft.title,
      body: draft.body ?? '',
      link: draft.link,
    })),
  )
}

async function safely(task: () => Promise<void>) {
  try {
    await task()
  } catch (error) {
    console.error('Could not create a notification:', error)
  }
}

export const notifyUsers = (userIds: number[], draft: NotificationDraft, options: Options = {}) =>
  safely(() => insertFor(userIds, draft, options))

export const notifyUser = (userId: number, draft: NotificationDraft, options: Options = {}) =>
  notifyUsers([userId], draft, options)

// Every teacher account (normally just one)
export const notifyTeachers = (draft: NotificationDraft, options: Options = {}) =>
  safely(async () => {
    const teachers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'teacher'), eq(users.status, 'active')))
    await insertFor(
      teachers.map((t) => t.id),
      draft,
      options,
    )
  })