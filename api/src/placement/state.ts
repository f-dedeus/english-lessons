import { count, eq } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { placementAttempts, placementQuestions } from '../db/schema/index.ts'

// True while the student still has to take (or finish) the placement test
export async function isPlacementRequired(studentId: number, needsPlacementTest: boolean) {
  if (!needsPlacementTest) return false

  const [{ total }] = await db.select({ total: count() }).from(placementQuestions)
  if (total === 0) return false

  const [attempt] = await db
    .select({ submittedAt: placementAttempts.submittedAt })
    .from(placementAttempts)
    .where(eq(placementAttempts.studentId, studentId))

  return !attempt?.submittedAt
}