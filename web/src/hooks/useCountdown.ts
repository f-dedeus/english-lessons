import { useEffect, useState } from 'react'

// Seconds left until `endsAt`, or null when there is no timer
export function useCountdown(endsAt: string | undefined, serverNow: string | undefined): number | null {
  // How far this computer's clock is from the server's, measured once
  const [offset] = useState(() => (serverNow ? Date.parse(serverNow) - Date.now() : 0))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [endsAt])

  if (!endsAt) return null
  return Math.max(0, Math.ceil((Date.parse(endsAt) - (now + offset)) / 1000))
}