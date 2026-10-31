const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000)
  const abs = Math.abs(seconds)

  if (abs < 60) return 'just now'
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86400) return formatter.format(Math.round(seconds / 86400), 'day')
  return new Date(iso).toLocaleDateString()
}