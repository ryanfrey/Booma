import { useEffect, useState } from 'react'

export function useCountdown(endsAt: string) {
  const target = new Date(endsAt).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const remainingMs = Math.max(0, target - now)
  const isEnded = remainingMs <= 0

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const label = isEnded
    ? 'Auction ended'
    : days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`

  return { remainingMs, isEnded, label }
}
