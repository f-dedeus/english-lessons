import { inArray } from 'drizzle-orm'
import { db } from './db/client.ts'
import { appSettings } from './db/schema/index.ts'

const DEFAULTS = {
  'placement.timeLimitMinutes': '40', // 0 = no time limit
  'placement.schedulingMessage':
    'Thank you! You finished the written test. The next step is a short conversation test with your teacher. Please contact your teacher to schedule it.',
}

export async function getPlacementSettings() {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, Object.keys(DEFAULTS)))
  const stored = new Map(rows.map((r) => [r.key, r.value]))

  const minutes = Number(stored.get('placement.timeLimitMinutes') ?? DEFAULTS['placement.timeLimitMinutes'])

  return {
    timeLimitMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    schedulingMessage:
      stored.get('placement.schedulingMessage') ?? DEFAULTS['placement.schedulingMessage'],
  }
}