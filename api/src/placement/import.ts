import { count } from 'drizzle-orm'
import { db } from '../db/client.ts'
import { placementAttempts, placementQuestions } from '../db/schema/index.ts'
import { PLACEMENT_TEST } from './test-content.ts'

export async function importPlacementTest() {
  const [{ total }] = await db.select({ total: count() }).from(placementAttempts)
  if (total > 0) {
    throw new Error(
      'Students have already taken the placement test, so its questions can no longer be replaced.',
    )
  }

  await db.transaction(async (tx) => {
    await tx.delete(placementQuestions)
    await tx.insert(placementQuestions).values(
      PLACEMENT_TEST.map((item, position) => ({
        position,
        level: item.level,
        content: {
          type: 'multiple_choice' as const,
          prompt: item.prompt,
          options: item.options,
          correct: [item.correct],
          multiple: false,
          ...(item.passage ? { passage: item.passage } : {}),
        },
      })),
    )
  })

  return PLACEMENT_TEST.length
}