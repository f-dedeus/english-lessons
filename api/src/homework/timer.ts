// Extra time the server allows after the limit, for slow connections
export const GRACE_MS = 30_000

export const endsAtOf = (startedAt: Date, limitMinutes: number) =>
  new Date(startedAt.getTime() + limitMinutes * 60_000)

// True when a timed homework was started, never sent, and is past its limit (plus the grace)
export function isExpired(
  homework: { limitMinutes: number | null; startedAt: Date | null; status: string },
  now = new Date(),
) {
  if (homework.limitMinutes === null || homework.startedAt === null || homework.status !== 'pending') {
    return false
  }
  return now.getTime() > endsAtOf(homework.startedAt, homework.limitMinutes).getTime() + GRACE_MS
}