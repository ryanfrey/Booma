import { useCallback, useEffect, useState } from 'react'

// Client-only for now (design brief step 2, mock data phase) — persisted to
// localStorage so the demo survives a refresh. Real watchlist persistence
// (synced server-side, reminders on ending-soon items) lands with the
// Supabase wiring milestone.
const STORAGE_KEY = 'booma:watchlist'

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeStored(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore — private browsing / storage disabled
  }
}

export function useWatchlist() {
  const [ids, setIds] = useState<Set<string>>(() => readStored())

  useEffect(() => {
    writeStored(ids)
  }, [ids])

  const isWatched = useCallback((id: string) => ids.has(id), [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return { count: ids.size, isWatched, toggle }
}
