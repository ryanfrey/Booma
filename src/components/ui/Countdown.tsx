import { useEffect, useState } from 'react'

// NOTE: ticks off the client clock for now. Once Supabase wiring lands (build
// order step 4), this should base itself on a client/server clock offset
// resolved when the page loads, per the design brief's "synced countdowns".
export function Countdown({ endsAt, className = '' }: { endsAt: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remainingMs = Math.max(0, new Date(endsAt).getTime() - now)
  const isEnded = remainingMs <= 0
  const isClosing = remainingMs > 0 && remainingMs <= 60_000

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const label = isEnded
    ? 'Ended'
    : days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : minutes > 0
          ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
          : `${seconds}s`

  return (
    <span
      className={`font-semibold tabular-nums ${isClosing ? 'text-warning' : 'text-ink-2'} ${className}`}
      aria-live="polite"
    >
      {label}
    </span>
  )
}
